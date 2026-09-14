import assert from "node:assert/strict";
import { test } from "node:test";
import { collectionStats, combineReceipts, exportCsv, formatNumber, InputError, localDate, normalizeNumber, parseCsv, parseReceiptInput, validateReceiptDate } from "./receipts.ts";

test("all 1,000 receipt numbers preserve their three-digit identity", () => {
  for (let number = 0; number < 1000; number++) {
    assert.equal(formatNumber(number).length, 3);
    assert.equal(normalizeNumber(formatNumber(number)), number);
  }
  assert.equal(formatNumber(normalizeNumber(" 7 ")), "007");
});

test("invalid numbers are rejected rather than coerced", () => {
  for (const input of ["", "-1", "1000", "0000", "1.5", "1e2", "+7", "007x", "Infinity", "NaN", "=1+1"]) {
    assert.throws(() => normalizeNumber(input), InputError, input);
  }
});

test("bulk entry counts repeated numbers and supports common separators", () => {
  assert.deepEqual(parseReceiptInput("007, 142;142\n908\t0 999"), [
    { number: 0, quantity: 1 },
    { number: 7, quantity: 1 },
    { number: 142, quantity: 2 },
    { number: 908, quantity: 1 },
    { number: 999, quantity: 1 },
  ]);
  assert.deepEqual(parseReceiptInput("7", 3), [{ number: 7, quantity: 3 }]);
  assert.throws(() => parseReceiptInput("7,8", 3), InputError);
  assert.throws(() => parseReceiptInput("7", 0), InputError);
  assert.throws(() => parseReceiptInput("7", 1.5), InputError);
  assert.throws(() => parseReceiptInput(", ;\n"), InputError);
  assert.throws(() => parseReceiptInput("007,999,1000"), InputError);
});

test("input limits and quantity validation apply before persistence", () => {
  assert.throws(() => parseReceiptInput("0".repeat(1_000_001)), InputError);
  assert.throws(() => combineReceipts([{ number: 1, quantity: 100_001 }]), InputError);
  assert.throws(() => combineReceipts([{ number: 1, quantity: 50_001 }, { number: 2, quantity: 50_000 }]), InputError);
  assert.throws(() => combineReceipts([{ number: 1, quantity: -1 }]), InputError);
  assert.throws(() => combineReceipts([{ number: 1, quantity: Number.MAX_SAFE_INTEGER + 1 }]), InputError);
  assert.throws(() => combineReceipts([{ number: -1, quantity: 1 }]), InputError);
  assert.throws(() => combineReceipts([{ number: 1.1, quantity: 1 }]), InputError);
  assert.throws(() => combineReceipts([{ number: 1, quantity: 0 }]), InputError);
});

test("duplicates count extra receipts, not just repeated numbers", () => {
  const counts = Array<number>(1000).fill(0);
  counts[7] = 3;
  counts[142] = 2;
  counts[999] = 1;
  assert.deepEqual(collectionStats(counts), {
    total: 6, unique: 3, duplicates: 3, duplicateNumbers: 2, missing: 997, completion: 0.3,
  });
  assert.equal(collectionStats(Array<number>(1000).fill(1)).completion, 100);
  assert.equal(collectionStats(Array<number>(1000).fill(0)).missing, 1000);
});

test("CSV handles leading zeros, BOM, quoted values, reordered headers and blank lines", () => {
  assert.deepEqual(parseCsv('\uFEFF"number","count"\r\n"007","2"\r\n\r\n999,1\r\n007,3\r\n000,0\r\n'), [
    { number: 7, quantity: 5 }, { number: 999, quantity: 1 },
  ]);
  assert.deepEqual(parseCsv(" COUNT , NUMBER \n2,7"), [{ number: 7, quantity: 2 }]);
  assert.deepEqual(parseCsv("number\n007\n007\n999"), [
    { number: 7, quantity: 2 }, { number: 999, quantity: 1 },
  ]);
});

test("malformed CSVs fail as a whole, including invalid final rows", () => {
  for (const csv of [
    "", "number,count", "wrong,count\n007,1", "number,number\n7,1", "number,count,notes\n7,1,test",
    "number,count\n007,1\n1000,1", "number,count\n007,-1", "number,count\n007,1.5",
    "number,count\n007,", "number,count\n007,1,extra", 'number,count\n"007,1',
    'number,count\n"007"x,1', 'number,count\n00"7,1', 'number,count\n"00""7",1',
    "number,count\n007,100001", "number,count\n007,999999999999999999999", "number,count\n007,0",
  ]) assert.throws(() => parseCsv(csv), InputError, csv);
});

test("CSV exports round-trip exact collection totals", () => {
  const counts = Array.from({ length: 1000 }, (_, number) => number % 7);
  const restored = Array<number>(1000).fill(0);
  const csv = exportCsv(counts.map((quantity, number) => ({ number, quantity })));
  assert.ok(csv.startsWith("number,count,date\r\n000,0,\r\n001,1,"));
  for (const entry of parseCsv(csv)) restored[entry.number] = entry.quantity;
  assert.deepEqual(restored, counts);
});

test("receipt dates require real ISO calendar dates without timezone conversion", () => {
  for (const date of ["2026-08-15", "2024-02-29", "2000-02-29", "0001-01-01", "9999-12-31"]) {
    assert.equal(validateReceiptDate(date), date);
  }
  for (const date of ["2026-02-29", "1900-02-29", "2026-04-31", "2026-00-01", "2026-13-01", "2026-01-00",
    "08/15/2026", "2026-8-15", "2026-08-15T00:00:00Z", "", "0000-01-01", " 2026-08-15", "10000-01-01"]) {
    assert.throws(() => validateReceiptDate(date), InputError, date);
  }
  assert.equal(localDate(new Date(2026, 8, 10, 0, 15)), "2026-09-10");
  assert.deepEqual(parseReceiptInput("7 8 7", 1, "2026-08-15"), [
    { number: 7, quantity: 2, receiptDate: "2026-08-15" },
    { number: 8, quantity: 1, receiptDate: "2026-08-15" },
  ]);
});

test("dated CSVs retain separate dates, aggregate matching dates, and preserve unknown dates", () => {
  const entries = parseCsv("number,count,date\n007,2,2026-08-15\n007,1,2026-08-16\n007,3,2026-08-15\n007,1,\n042,1,");
  assert.deepEqual(entries, [
    { number: 7, quantity: 1 },
    { number: 7, quantity: 5, receiptDate: "2026-08-15" },
    { number: 7, quantity: 1, receiptDate: "2026-08-16" },
    { number: 42, quantity: 1 },
  ]);
  assert.deepEqual(parseCsv(exportCsv(entries)), entries);
  assert.deepEqual(parseCsv("date,number\n2026-08-15,7"), [{ number: 7, quantity: 1, receiptDate: "2026-08-15" }]);
  assert.throws(() => parseCsv("number,count,date\n007,2,2026-08-15\n008,1,2026-02-30"), InputError);
  assert.throws(() => parseCsv("number,date,date\n007,2026-08-15,2026-08-16"), InputError);
  assert.throws(() => parseReceiptInput("7", 1, "2026-02-30"), InputError);
});
