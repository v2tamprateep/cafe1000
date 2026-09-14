import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createStaticServer } from "./serve-static.mjs";

for (const basePath of ["", "/cafe-1000"]) {
  test(`preview serves only static files at ${basePath || "/"}`, async () => {
    const directory = await mkdtemp(join(tmpdir(), "cafe-static-test-"));
    const output = join(directory, "out");
    let server;
    try {
      await mkdir(join(output, "_next"), { recursive: true });
      await writeFile(join(output, "index.html"), "<h1>Cafe 1000</h1>");
      await writeFile(join(output, "_next", "app.js"), "console.log('static')");
      await writeFile(join(directory, "private.txt"), "not public");
      server = createStaticServer(output, basePath);
      server.listen(0, "127.0.0.1");
      await once(server, "listening");
      const origin = `http://127.0.0.1:${server.address().port}`;
      const home = await fetch(`${origin}${basePath}/`);
      assert.equal(home.status, 200);
      assert.equal(home.headers.get("content-type"), "text/html; charset=utf-8");
      assert.equal(home.headers.get("x-content-type-options"), "nosniff");
      assert.equal(await home.text(), "<h1>Cafe 1000</h1>");
      const head = await fetch(`${origin}${basePath}/`, { method: "HEAD" });
      assert.equal(head.status, 200);
      assert.equal(await head.text(), "");
      const asset = await fetch(`${origin}${basePath}/_next/app.js`);
      assert.equal(asset.status, 200);
      assert.match(asset.headers.get("content-type"), /javascript/);
      for (const path of ["api/data", "data/cafe.sqlite", ".env.local", "%2e%2e%2fprivate.txt", "%5c..%5cprivate.txt"]) {
        assert.equal((await fetch(`${origin}${basePath}/${path}`)).status, 404, path);
      }
      assert.equal((await fetch(`${origin}${basePath}/%ZZ`)).status, 400);
      assert.equal((await fetch(`${origin}${basePath}/api/receipts`, { method: "POST", body: "{}" })).status, 405);
      if (basePath) {
        const redirect = await fetch(origin, { redirect: "manual" });
        assert.equal(redirect.status, 308);
        assert.equal(redirect.headers.get("location"), `${basePath}/`);
        assert.equal((await fetch(`${origin}/_next/app.js`)).status, 404);
      }
    } finally {
      if (server) {
        server.closeAllConnections();
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      }
      await rm(directory, { recursive: true, force: true });
    }
  });
}
