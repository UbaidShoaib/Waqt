// Tenant brand-color helpers (TRD §10). Owners can pick any hex, so the
// foreground on brand-colored surfaces is chosen for contrast, not assumed.

const INK = "#12332b";
const WHITE = "#ffffff";
export const DEFAULT_BRAND = "#e59a1e";

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Ink or white — whichever reads better on the brand color. */
export function readableOn(hex: string): string {
  return contrast(hex, INK) >= contrast(hex, WHITE) ? INK : WHITE;
}

/** Inline style that themes a subtree with a tenant's brand color. */
export function brandStyle(brandColor: string | null | undefined): React.CSSProperties {
  const brand = brandColor && /^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : DEFAULT_BRAND;
  return {
    ["--brand-color" as string]: brand,
    ["--brand-fg" as string]: readableOn(brand),
  };
}
