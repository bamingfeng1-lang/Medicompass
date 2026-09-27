// Lightweight in-memory sliding-window rate limiter for the mobile auth
// endpoints (brute-force / abuse speed bump on login, register, OTP, Apple).
//
// NOTE: state lives in this process's memory, so it protects a single running
// server instance (our long-lived Node mobile API, runtime="nodejs"). Behind
// multiple instances or serverless fan-out this must be swapped for a shared
// store (e.g. Redis). It is not a distributed quota.

type Hit = { count: number; resetAt: number };
const buckets = new Map<string, Hit>();

export type RateLimitResult = { ok: boolean; remaining: number; retryAfter: number };

/** Count one hit against `key`; returns ok=false once `limit` is exceeded within `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const hit = buckets.get(key);
  if (!hit || hit.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  hit.count += 1;
  if (hit.count > limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((hit.resetAt - now) / 1000) };
  }
  return { ok: true, remaining: limit - hit.count, retryAfter: 0 };
}

/** Best-effort client IP from common proxy headers, else a shared fallback bucket. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export function tooManyRequests(retryAfter: number): Response {
  return Response.json(
    { error: "too_many_requests" },
    { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfter)) } },
  );
}

// Evict expired buckets periodically so the map can't grow unbounded. unref so
// this timer never keeps the process alive on its own.
const sweep = setInterval(() => {
  const now = Date.now();
  buckets.forEach((v, k) => {
    if (v.resetAt <= now) buckets.delete(k);
  });
}, 60_000);
sweep.unref?.();
