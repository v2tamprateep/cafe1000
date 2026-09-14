import type { Snapshot } from "./contracts.ts";
import { collectionStats, formatNumber, NUMBER_COUNT, parseCsv } from "./receipts.ts";

export function buildSnapshot(csv: string, name = "CDP Dining"): Snapshot {
  const receipts = parseCsv(csv, true);
  const counts = Array<number>(NUMBER_COUNT).fill(0);
  let undatedReceipts = 0;
  const dated = new Map<string, typeof receipts>();
  for (const receipt of receipts) {
    counts[receipt.number] += receipt.quantity;
    if (receipt.receiptDate) {
      const day = dated.get(receipt.receiptDate) ?? [];
      day.push(receipt);
      dated.set(receipt.receiptDate, day);
    } else {
      undatedReceipts += receipt.quantity;
    }
  }
  let total = 0;
  const seen = new Set<number>();
  const receiptProgress = [...dated].sort(([a], [b]) => a.localeCompare(b)).map(([date, entries]) => {
    for (const entry of entries) {
      total += entry.quantity;
      seen.add(entry.number);
    }
    return { date, total, unique: seen.size };
  });
  return {
    collection: { name },
    receipts,
    counts,
    stats: collectionStats(counts),
    receiptProgress,
    undatedReceipts,
    topDuplicates: counts.flatMap((count, number) => count > 1 ? [{ number: formatNumber(number), count }] : [])
      .sort((a, b) => b.count - a.count || a.number.localeCompare(b.number)),
  };
}
