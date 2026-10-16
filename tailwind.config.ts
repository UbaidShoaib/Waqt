import type { Config } from "tailwindcss";

// Waqt design tokens — Direction A "Saffron Hour". Values live as CSS
// variables in globals.css so they can be themed; Tailwind only names them.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "var(--ink)", muted: "var(--ink-muted)", soft: "var(--ink-soft)" },
        paper: { DEFAULT: "var(--paper)", raised: "var(--paper-raised)" },
        line: { DEFAULT: "var(--line)", soft: "var(--line-soft)" },
        saffron: "var(--saffron)",
        // Tenant brand color + a readable foreground for it, injected per
        // tenant at render time (TRD §10) — never hardcoded per tenant.
        brand: { DEFAULT: "var(--brand-color)", fg: "var(--brand-fg)" },
        danger: { DEFAULT: "var(--danger)", soft: "var(--danger-soft)" },
        success: { DEFAULT: "var(--success)", soft: "var(--success-soft)" },
        notice: { DEFAULT: "var(--notice)", soft: "var(--notice-soft)" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "14px", pill: "999px" },
      boxShadow: { lift: "0 1px 2px rgba(18,51,43,.06), 0 8px 24px rgba(18,51,43,.06)" },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { rise: "rise .28s ease-out both" },
    },
  },
  plugins: [],
};

export default config;
