// Simple per-IP limit so the public site can't be used to run up Gemini costs.
// In-memory, so each Cloud Run instance (max 3) keeps its own count; that is
// enough to stop accidental or casual abuse.

const hits = new Map<string, number[]>();

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

/** Returns true if the request is allowed. */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing without bound.
  if (hits.size > 10_000) {
    for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return true;
}
