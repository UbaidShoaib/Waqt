/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Long-cache the widget loader. Deny framing everywhere EXCEPT /embed/*,
        // whose frame-ancestors CSP is generated per-request in middleware.ts
        // from the tenant's domain whitelist (TRD §11, §14).
        source: "/widget.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/((?!embed).*)",
        headers: [{ key: "X-Frame-Options", value: "DENY" }],
      },
    ];
  },
};

export default nextConfig;
