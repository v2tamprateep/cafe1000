import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSnapshot } from "./collection.ts";
import { exportCsv, InputError } from "./receipts.ts";

test("static snapshots preserve duplicate counts and aggregate only matching number/date pairs", () => {
  const snapshot = buildSnapshot("number,count,date\n007,2,2026-08-15\n007,1,2026-08-16\n007,3,2026-08-15\n007,1,\n999,2,2026-08-16", "Dining club");
  assert.equal(snapshot.collection.name, "Dining club");
  assert.equal(snapshot.counts.length, 1000);
  assert.equal(snapshot.counts[7], 7);
  assert.equal(snapshot.counts[999], 2);
  assert.deepEqual(snapshot.stats, {
    total: 9, unique: 2, duplicates: 7, missing: 998, duplicateNumbers: 2, completion: 0.2,
  });
  assert.deepEqual(snapshot.topDuplicates, [{ number: "007", count: 7 }, { number: "999", count: 2 }]);
  assert.deepEqual(snapshot.receipts, [
    { number: 7, quantity: 1 },
    { number: 7, quantity: 5, receiptDate: "2026-08-15" },
    { number: 7, quantity: 1, receiptDate: "2026-08-16" },
    { number: 999, quantity: 2, receiptDate: "2026-08-16" },
  ]);
  assert.deepEqual(buildSnapshot(exportCsv(snapshot.receipts), "Dining club"), snapshot);
});

test("timeline is chronological and excludes unknown dates rather than inventing them", () => {
  const snapshot = buildSnapshot("number,count,date\n001,3,\n007,1,2026-08-16\n007,2,2024-02-29\n008,2,2026-08-16");
  assert.deepEqual(snapshot.receiptProgress, [
    { date: "2024-02-29", total: 2, unique: 1 },
    { date: "2026-08-16", total: 5, unique: 2 },
  ]);
  assert.equal(snapshot.undatedReceipts, 3);
  assert.equal(snapshot.stats.total, 8);
  assert.equal(snapshot.stats.unique, 3);
});

test("header-only, zero-only, and wholly undated collections work", () => {
  for (const csv of ["number,count,date\n", "number,count,date\n007,0,\n"]) {
    const empty = buildSnapshot(csv);
    assert.equal(empty.stats.total, 0);
    assert.equal(empty.stats.missing, 1000);
    assert.deepEqual(empty.receipts, []);
    assert.deepEqual(empty.receiptProgress, []);
    assert.deepEqual(buildSnapshot(exportCsv(empty.receipts)), empty);
  }
  const undated = buildSnapshot("number\n7\n7");
  assert.equal(undated.undatedReceipts, 2);
  assert.deepEqual(undated.receiptProgress, []);
});

test("build rejects malformed data even for zero-count rows and empty collections", () => {
  for (const csv of ["", "wrong,count,date\n", "number,count,date\n1000,0,", "number,count,date\n007,0,2026-02-30",
    "number,count,date\n007,1,\n008,-1,", "number,count,date\n007,1,\n008,1,2026-02-30",
    "number,count,date\n007,100001,", "number,count,date\n007,9007199254740992,"]) {
    assert.throws(() => buildSnapshot(csv), InputError, csv);
  }
});

test("correcting or removing source rows changes totals without retaining obsolete receipts", () => {
  const before = buildSnapshot("number,count,date\n007,3,2026-09-01\n008,2,2026-09-02");
  const after = buildSnapshot("number,count,date\n007,1,2026-08-31");
  assert.equal(before.stats.total, 5);
  assert.equal(after.counts[7], 1);
  assert.equal(after.counts[8], 0);
  assert.equal(after.stats.duplicates, 0);
  assert.deepEqual(after.receiptProgress, [{ date: "2026-08-31", total: 1, unique: 1 }]);
});

test("complete collection has deterministic duplicate ranking and no missing numbers", () => {
  const csv = "number,count,date\n" + Array.from({ length: 1000 }, (_, number) => `${number},2,`).join("\n");
  const snapshot = buildSnapshot(csv);
  assert.equal(snapshot.stats.completion, 100);
  assert.equal(snapshot.stats.missing, 0);
  assert.equal(snapshot.stats.duplicates, 1000);
  assert.equal(snapshot.topDuplicates[0].number, "000");
  assert.equal(snapshot.topDuplicates[999].number, "999");
});
