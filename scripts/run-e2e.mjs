import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const result = spawnSync(process.execPath, [
  resolve("node_modules", "@playwright", "test", "cli.js"),
  "test",
  ...process.argv.slice(2),
], { stdio: "inherit", env: process.env });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
