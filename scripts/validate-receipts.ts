import { readFileSync } from "node:fs";
import { buildSnapshot } from "../src/lib/collection.ts";
import { collectionName } from "../src/lib/site.ts";

const file = new URL("../data/receipts.csv", import.meta.url);
const snapshot = buildSnapshot(readFileSync(file, "utf8"), collectionName);
console.log(`Receipt data valid: ${snapshot.stats.total} receipts, ${snapshot.stats.unique} unique numbers, ${snapshot.stats.duplicates} extra copies, ${snapshot.undatedReceipts} undated.`);
