export function normalizeAllowedOrigin(value: string) {
  try {
    const url = new URL(value);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password ||
      (url.pathname !== "/" && url.pathname !== "") ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function countUniqueOrigins(origins: string[]) {
  return new Set(
    origins.map(
      (origin) =>
        normalizeAllowedOrigin(origin.trim()) ?? origin.trim().toLowerCase(),
    ),
  ).size;
}
