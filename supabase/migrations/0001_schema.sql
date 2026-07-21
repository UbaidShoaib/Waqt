-- Waqt MVP schema (TRD §6). Single DB, shared schema, tenant isolation via
-- business_id FK on every table + RLS (0002_rls.sql).

create extension if not exists "pgcrypto";

create table businesses (
  id              uuid primary key default gen_random_uuid(),
  owner_user_id   uuid not null references auth.users (id),
  name            text not null,
  slug            text not null unique,
  timezone        text not null default 'UTC',
  currency        text not null default 'USD',
  logo_url        text,
  brand_color     text,
  welcome_message text,
  created_at      timestamptz not null default now()
);

create index businesses_owner_idx on businesses (owner_user_id);
create index businesses_slug_idx on businesses (slug);

-- Widget embed whitelist (TRD §11). Domain is normalized on save:
-- no protocol, no path, no trailing slash. www. and bare domain are
-- separate entries.
create table business_allowed_domains (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  domain      text not null,
  created_at  timestamptz not null default now(),
  unique (business_id, domain)
);

create table services (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses (id) on delete cascade,
  name         text not null,
  duration_min int not null check (duration_min > 0),
  price_cents  int not null default 0 check (price_cents >= 0),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index services_business_idx on services (business_id);

create table availability_rules (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  check (start_time < end_time)
);

create index availability_business_idx on availability_rules (business_id);

create table customers (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses (id) on delete cascade,
  name              text not null,
  phone             text,
  email             text,
  preferred_channel text not null default 'whatsapp'
    check (preferred_channel in ('whatsapp', 'sms', 'email')),
  created_at        timestamptz not null default now(),
  check (phone is not null or email is not null)
);

create index customers_business_idx on customers (business_id);

create table bookings (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses (id) on delete cascade,
  service_id     uuid not null references services (id),
  customer_id    uuid not null references customers (id),
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  status         text not null default 'confirmed'
    check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid')),
  source         text not null default 'direct_link'
    check (source in ('direct_link', 'widget')),
  created_at     timestamptz not null default now(),
  check (starts_at < ends_at)
);

create index bookings_business_starts_idx on bookings (business_id, starts_at);
-- Prevent double-booking the same slot for the same business.
create unique index bookings_no_overlap_guard
  on bookings (business_id, starts_at)
  where status = 'confirmed';

create table notifications_log (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  channel    text not null check (channel in ('whatsapp', 'sms', 'email')),
  type       text not null check (type in ('confirmation', 'reminder_24h', 'reminder_1h', 'cancellation')),
  status     text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'retried')),
  sent_at    timestamptz
);

create index notifications_booking_idx on notifications_log (booking_id);
