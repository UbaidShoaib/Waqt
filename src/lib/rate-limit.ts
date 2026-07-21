// Rate limiting for public booking creation (TRD §8).
//
// !! PILOT-LAUNCH GATE (TRD §18): this in-memory implementation is a dev
// placeholder — it does NOT work across serverless instances. Replace with
// Upstash Redis (@upstash/ratelimit) BEFORE onboarding pilot businesses.

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  { limit = 5, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { ok: boolean } {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  entry.count += 1;
  return { ok: entry.count <= limit };
}
