/**
 * In-memory sliding-window rate limiter.
 *
 * Each entry in the store is an array of hit timestamps (ms) for a given key.
 * On every call we:
 *   1. Prune timestamps that have fallen outside the current window.
 *   2. Compare the remaining count against the limit.
 *   3. Record the new timestamp only when the request is allowed.
 *
 * Trade-offs:
 *   - State lives in the Node.js module singleton, so it resets on process
 *     restart and is NOT shared across multiple replicas. For a small SaaS
 *     running on a single instance this is acceptable and avoids Redis.
 *   - Memory is bounded: each entry holds at most `limit` timestamps and stale
 *     entries are cleaned up by a periodic sweep (see bottom of file).
 */

interface WindowEntry {
  hits: number[]; // Unix timestamps in milliseconds
}

// Module-level store — one Map instance per process lifetime.
const store = new Map<string, WindowEntry>();

/**
 * Check whether the caller identified by `ip` has exceeded the rate limit for
 * the given logical `key` (e.g. "login", "reservations", "checkout").
 *
 * @param ip          - Caller IP address used as the primary identifier.
 * @param key         - Logical action name, namespaces the limit bucket.
 * @param limit       - Maximum number of requests allowed within `windowMs`.
 * @param windowMs    - Sliding window duration in milliseconds.
 * @returns `{ allowed: true }` when the request may proceed, or
 *          `{ allowed: false, retryAfterSeconds: number }` when the limit is
 *          exceeded, where `retryAfterSeconds` is the number of whole seconds
 *          until the oldest hit ages out of the window.
 */
export function checkRateLimit(
  ip: string,
  key: string,
  limit: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const storeKey = `${key}:${ip}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const entry = store.get(storeKey) ?? { hits: [] };

  // Prune hits that are outside the current sliding window.
  entry.hits = entry.hits.filter((ts) => ts > windowStart);

  if (entry.hits.length >= limit) {
    // The oldest hit in the window determines when the caller can retry.
    const oldestHit = entry.hits[0];
    const retryAfterMs = oldestHit + windowMs - now;
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
    store.set(storeKey, entry);
    return { allowed: false, retryAfterSeconds };
  }

  entry.hits.push(now);
  store.set(storeKey, entry);
  return { allowed: true };
}

/**
 * Extract the caller's IP from a Next.js `Request` / `NextRequest`.
 *
 * Proxy deployments (Vercel, nginx, Cloudflare) forward the real client IP in
 * `x-forwarded-for`. The header may contain a comma-separated list of IPs
 * (client, proxy1, proxy2 …); the first entry is the originating client.
 * Falls back to `"unknown"` when no IP can be determined — the limiter will
 * still function but all requests without a detectable IP share one bucket,
 * which is the safest default.
 */
export function getIpFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }

  // `x-real-ip` is set by some reverse proxies (nginx).
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}

/**
 * Extract the caller's IP when inside a Server Action, where the request
 * object is not directly available and IP headers must be read via Next.js's
 * `headers()` API.
 *
 * @param headersList - The `ReadonlyHeaders` object returned by `headers()`.
 */
export function getIpFromHeaders(
  headersList: Awaited<ReturnType<typeof import('next/headers').headers>>,
): string {
  const forwarded = headersList.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }

  const realIp = headersList.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}

// ---------------------------------------------------------------------------
// Periodic cleanup — remove entries whose entire hit list has aged out.
// This prevents the store from growing indefinitely on long-running servers.
// The sweep runs every 10 minutes and only removes truly stale entries, so it
// never interferes with active rate-limiting windows.
// ---------------------------------------------------------------------------
const SWEEP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

function sweepStaleEntries() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    // Derive the window from the key suffix is not possible here, so we use a
    // generous 2-hour cutoff — any hit older than 2 hours is certainly outside
    // even the longest window used by this application (1 hour).
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    entry.hits = entry.hits.filter((ts) => ts > now - TWO_HOURS_MS);
    if (entry.hits.length === 0) {
      store.delete(key);
    }
  }
}

// Only register the interval in server-side (Node.js) contexts.
if (typeof setInterval !== 'undefined' && typeof window === 'undefined') {
  const interval = setInterval(sweepStaleEntries, SWEEP_INTERVAL_MS);
  // Allow the Node.js process to exit cleanly even if the interval is pending.
  if (typeof interval === 'object' && interval !== null && 'unref' in interval) {
    (interval as NodeJS.Timeout).unref();
  }
}
