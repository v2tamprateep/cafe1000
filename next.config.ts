import type { NextConfig } from "next";
import { normalizeBasePath } from "./src/lib/site.ts";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: normalizeBasePath(process.env.CAFE_BASE_PATH),
  poweredByHeader: false,
  logging: { incomingRequests: false },
};

export default nextConfig;
