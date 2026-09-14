import type { ReceiptInput, Snapshot } from "./contracts.ts";

export const NUMBER_COUNT = 1000;
export const MAX_BATCH_RECEIPTS = 100_000;
export const MAX_INPUT_LENGTH = 1_000_000;

export class InputError extends Error {}

export function formatNumber(value: number): string {
  return String(value).padStart(3, "0");
}

export function normalizeNumber(value: string): number {
  const trimmed = value.trim();
  if (!/^\d{1,3}$/.test(trimmed)) {
    throw new InputError(`"${trimmed.slice(0, 24)}" is not a receipt number. Use 000 through 999.`);
  }
  return Number(trimmed);
}

export function validateReceiptDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-")) {
    throw new InputError("Use a receipt date in YYYY-MM-DD format.");
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new InputError(`"${value}" is not a valid calendar date.`);
  }
  return value;
}

export function localDate(date = new Date()): string {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function checkLength(input: string): void {
  if (input.length > MAX_INPUT_LENGTH) {
    throw new InputError("This input is too large. Import at most 1 MB at a time.");
  }
}

export function combineReceipts(entries: ReceiptInput[], allowEmpty = false): ReceiptInput[] {
  const quantities = new Map<string, ReceiptInput>();
  let total = 0;
  for (const { number, quantity, receiptDate } of entries) {
    if (!Number.isInteger(number) || number < 0 || number >= NUMBER_COUNT) {
      throw new InputError("Receipt numbers must be between 000 and 999.");
    }
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      throw new InputError("Quantities must be whole numbers of zero or more.");
    }
    if (receiptDate !== undefined) validateReceiptDate(receiptDate);
    total += quantity;
    if (total > MAX_BATCH_RECEIPTS) {
      throw new InputError("Add at most 100,000 receipts in one batch.");
    }
    if (quantity > 0) {
      const key = `${number}:${receiptDate ?? ""}`;
      quantities.set(key, {
        number,
        quantity: (quantities.get(key)?.quantity ?? 0) + quantity,
        ...(receiptDate === undefined ? {} : { receiptDate }),
      });
    }
  }
  if (!total && !allowEmpty) throw new InputError("Add at least one receipt.");
  return [...quantities.values()].sort((a, b) => a.number - b.number || (a.receiptDate ?? "").localeCompare(b.receiptDate ?? ""));
}

export function parseReceiptInput(input: string, quantity = 1, receiptDate?: string): ReceiptInput[] {
  checkLength(input);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_BATCH_RECEIPTS) {
    throw new InputError("Quantity must be a whole number between 1 and 100,000.");
  }
  const tokens = input.trim().split(/[\s,;]+/).filter(Boolean);
  if (!tokens.length) throw new InputError("Enter a receipt number first.");
  if (tokens.length > 1 && quantity !== 1) {
    throw new InputError("Use quantity with a single number, or list each receipt separately.");
  }
  return combineReceipts(tokens.map((token) => ({ number: normalizeNumber(token), quantity, ...(receiptDate === undefined ? {} : { receiptDate }) })));
}

function readCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let quoteClosed = false;
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
        quoteClosed = true;
      } else {
        field += char;
      }
    } else if (char === '"' && !field.trim() && !quoteClosed) {
      field = "";
      quoted = true;
    } else if (char === "," || char === "\n") {
      row.push(field.trim());
      field = "";
      quoteClosed = false;
      if (char === "\n") {
        if (row.some(Boolean)) rows.push(row);
        row = [];
      }
    } else if (char === '"' || (quoteClosed && char.trim())) {
      throw new InputError("Malformed CSV. Check the quotes and column separators.");
    } else {
      field += char;
    }
  }
  if (quoted) throw new InputError("Malformed CSV: a quoted field is not closed.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parseCsv(csv: string, allowEmpty = false): ReceiptInput[] {
  checkLength(csv);
  const [header, ...rows] = readCsvRows(csv);
  if (!header) throw new InputError("The CSV file is empty.");
  const columns = header.map((value) => value.toLowerCase());
  const numberIndex = columns.indexOf("number");
  const countIndex = columns.indexOf("count");
  const dateIndex = columns.indexOf("date");
  if (
    numberIndex < 0 ||
    columns.some((column) => column !== "number" && column !== "count" && column !== "date") ||
    new Set(columns).size !== columns.length
  ) {
    throw new InputError('Use a CSV with a "number" column and optional "count" and "date" columns.');
  }
  return combineReceipts(rows.map((row, index) => {
    if (row.length !== columns.length) {
      throw new InputError(`CSV row ${index + 2} has the wrong number of columns.`);
    }
    if (countIndex >= 0 && !/^\d+$/.test(row[countIndex])) {
      throw new InputError(`CSV row ${index + 2} needs a whole-number count of zero or more.`);
    }
    return {
      number: normalizeNumber(row[numberIndex]),
      quantity: countIndex < 0 ? 1 : Number(row[countIndex]),
      ...(dateIndex < 0 || !row[dateIndex] ? {} : { receiptDate: validateReceiptDate(row[dateIndex]) }),
    };
  }), allowEmpty);
}

export function collectionStats(counts: number[]): Snapshot["stats"] {
  const total = counts.reduce((sum, count) => sum + count, 0);
  const unique = counts.filter((count) => count > 0).length;
  return {
    total,
    unique,
    duplicates: total - unique,
    missing: NUMBER_COUNT - unique,
    duplicateNumbers: counts.filter((count) => count > 1).length,
    completion: unique / 10,
  };
}

export function exportCsv(entries: ReceiptInput[]): string {
  const collected = new Set(entries.map((entry) => entry.number));
  const rows = [...entries];
  for (let number = 0; number < NUMBER_COUNT; number++) {
    if (!collected.has(number)) rows.push({ number, quantity: 0 });
  }
  rows.sort((a, b) => a.number - b.number || (a.receiptDate ?? "").localeCompare(b.receiptDate ?? ""));
  return "number,count,date\r\n" + rows.map((entry) =>
    `${formatNumber(entry.number)},${entry.quantity},${entry.receiptDate ?? ""}`,
  ).join("\r\n") + "\r\n";
}
