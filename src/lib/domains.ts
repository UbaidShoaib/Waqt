// Widget embed domain whitelist helpers (TRD §11).

/**
 * Normalize a domain on save: strip protocol, path, port, trailing slash,
 * lowercase. "www." and bare domain are DELIBERATELY separate entries.
 */
export function normalizeDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    const host = url.hostname;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return null;
    return host;
  } catch {
    return null;
  }
}

/** Extract a normalized host from an Origin or Referer header value. */
export function hostFromHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Build the per-tenant CSP frame-ancestors value (TRD §11.2).
 * Never a wildcard. Zero whitelisted domains → 'none' (embed inert until the
 * owner adds a domain — confirmed default, TRD §19).
 */
export function frameAncestorsValue(allowedDomains: string[]): string {
  if (allowedDomains.length === 0) return "'none'";
  const sources = allowedDomains
    .map((d) => `https://${d}`)
    .join(" ");
  return `'self' ${sources}`;
}

export function isAllowedEmbedHost(
  host: string | null,
  allowedDomains: string[]
): boolean {
  if (!host) return false;
  return allowedDomains.includes(host);
}
