import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CollectionSite } from "@/components/collection-site";
import { buildSnapshot } from "@/lib/collection";
import { collectionName, repositoryUrl } from "@/lib/site";

export default function Home() {
  const csv = readFileSync(join(process.cwd(), "data", "receipts.csv"), "utf8");
  return <CollectionSite snapshot={buildSnapshot(csv, collectionName)} repositoryUrl={repositoryUrl(process.env.CAFE_REPOSITORY_URL)}/>;
}
