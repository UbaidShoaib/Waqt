# Waqt

Booking-and-scheduling SaaS for service SMBs. Two differentiators: per-tenant
branding (logo/color/welcome message) and an embeddable widget any business
can add to their own site. Full spec: `waqt-trd.md` (Google Drive) — the TRD
is the source of truth; this README is orientation only.

## Stack

Next.js 14 (App Router, TypeScript) · Supabase (Postgres + Auth + Storage,
RLS) · Tailwind · Vercel (hosting + cron) · WhatsApp Cloud API / Twilio /
Resend for messaging.

## Layout

```
supabase/migrations/     0001 schema · 0002 RLS policies (TRD §6, §9)
src/lib/supabase/        server.ts (session client, RLS applies)
                         admin.ts  (service-role client — read its header)
src/lib/slots.ts         slot-availability calculation (unit-tested)
src/lib/domains.ts       embed whitelist normalization + CSP builder
src/lib/messaging/       channel dispatch w/ fallback (providers = Week 3)
src/middleware.ts        per-tenant CSP frame-ancestors + Origin check for /embed
src/app/b/[slug]/        public booking page (direct link)
src/app/embed/[slug]/    iframe embed (chrome-less, whitelist-gated)
src/app/dashboard/       owner dashboard + embed-code generator
src/app/api/             routes per TRD §8
public/widget.js         embed loader (<10kb, postMessage bridge)
tests/                   slots unit tests · RLS isolation suite (CI hard gate)
```

## Security invariants (TRD §9 — do not weaken)

1. RLS on every tenant-scoped table; owner policies keyed on `auth.uid()`.
2. `business_id` always derived from the session server-side — never read
   from a request body or query string on authenticated routes.
3. Public routes use the service-role key with slug-scoped queries and an
   explicit public-field allowlist (`PUBLIC_BUSINESS_FIELDS`).
4. `tests/rls.test.ts` must pass in CI before any pilot onboarding.
5. `/embed/:slug` is gated by per-tenant `frame-ancestors` CSP + server-side
   Origin check; snippet inert until a domain is whitelisted.

## Getting started

```bash
npm install
cp .env.example .env.local        # fill in Supabase keys
npx supabase start                # or link a hosted project
npx supabase db push              # applies migrations
npm run dev
```

Tests: `npm test` (slot tests run standalone; RLS suite auto-skips unless
SUPABASE_URL/keys are set — point it at a local or dev project, never prod).

## Known placeholders (intentional)

- `src/lib/rate-limit.ts` is in-memory — replace with Upstash Redis before
  pilot launch (TRD §18).
- Messaging provider sends are stubs until Week 3.
- BookingFlow has service selection only; slot picker + contact form are
  Week 2 work.
- Auth pages (`/login`, `/onboarding`) not yet scaffolded.

## Build plan

Week 1 Foundation · Week 2 Booking Engine · Week 3 Messaging · Week 4 Widget ·
Week 5 Hardening/Pilot (TRD §16). If cutting to 4 weeks: drop SMS/email
fallback, never the RLS work.
