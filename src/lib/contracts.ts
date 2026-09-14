export type ReceiptInput = { number: number; quantity: number; receiptDate?: string };

export type Snapshot = {
  collection: { name: string };
  receipts: ReceiptInput[];
  counts: number[];
  stats: {
    total: number;
    unique: number;
    duplicates: number;
    missing: number;
    duplicateNumbers: number;
    completion: number;
  };
  receiptProgress: { date: string; total: number; unique: number }[];
  undatedReceipts: number;
  topDuplicates: { number: string; count: number }[];
};
