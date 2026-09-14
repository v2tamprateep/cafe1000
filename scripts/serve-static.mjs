import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import nextEnv from "@next/env";
import { normalizeBasePath } from "../src/lib/site.ts";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

export function createStaticServer(directory, basePath = "") {
  const root = resolve(directory);
  const mount = normalizeBasePath(basePath);
  return createServer(async (request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Cache-Control", "no-cache");
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end("This is a read-only static site.");
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    } catch (error) {
      if (!(error instanceof URIError || error instanceof TypeError)) throw error;
      response.writeHead(400).end("Invalid URL.");
      return;
    }
    if (mount && (pathname === "/" || pathname === mount)) {
      response.writeHead(308, { Location: `${mount}/` }).end();
      return;
    }
    if (!pathname.startsWith(`${mount}/`)) {
      response.writeHead(404).end("Not found.");
      return;
    }
    const suffix = pathname.slice(mount.length + 1);
    const file = resolve(root, suffix || "index.html");
    const within = relative(root, file);
    if (pathname.includes("\\") || pathname.includes("\0") || within === ".." || within.startsWith(`..${sep}`) || isAbsolute(within)) {
      response.writeHead(404).end("Not found.");
      return;
    }
    try {
      const target = (await stat(file)).isDirectory() ? resolve(file, "index.html") : file;
      const info = await stat(target);
      if (!info.isFile()) {
        response.writeHead(404).end("Not found.");
        return;
      }
      response.writeHead(200, {
        "Content-Type": mimeTypes[extname(target)] ?? "application/octet-stream",
        "Content-Length": info.size,
      });
      if (request.method === "HEAD") response.end();
      else createReadStream(target).on("error", (error) => {
        console.error("Could not read static asset:", error);
        response.destroy(error);
      }).pipe(response);
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") response.writeHead(404).end("Not found.");
      else {
        console.error("Could not serve static asset:", error);
        response.writeHead(500).end("Could not serve static asset.");
      }
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  nextEnv.loadEnvConfig(process.cwd(), false);
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== "--port")) {
    throw new Error("Usage: npm start -- --port 3000");
  }
  const port = args.length ? Number(args[1]) : 3000;
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Port must be between 1 and 65535.");
  if (!existsSync(resolve("out", "index.html"))) throw new Error("No static export found. Run npm run build first.");
  const basePath = normalizeBasePath(process.env.CAFE_BASE_PATH);
  const server = createStaticServer("out", basePath);
  server.on("error", (error) => { console.error(error); process.exitCode = 1; });
  server.listen(port, "127.0.0.1", () => console.log(`Cafe 1000: http://localhost:${port}${basePath}/ (static files only)`));
}
