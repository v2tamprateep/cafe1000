export const collectionName = "CDP Dining";

export function normalizeBasePath(value = ""): string {
  if (!value || value === "/") return "";
  const path = value.replace(/\/$/, "");
  if (!/^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(path)) {
    throw new Error("CAFE_BASE_PATH must be empty or a path such as /cafe-1000.");
  }
  return path;
}

export function repositoryUrl(value = ""): string | null {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error("CAFE_REPOSITORY_URL must be an HTTPS repository URL without credentials, query, or fragment.");
  }
  return url.href.replace(/\/$/, "");
}
