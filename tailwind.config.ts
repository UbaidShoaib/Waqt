import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tenant brand color is injected as a CSS custom property at render
        // time (TRD §10) — never hardcoded per tenant.
        brand: "var(--brand-color, #0f172a)",
      },
    },
  },
  plugins: [],
};

export default config;
