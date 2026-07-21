-- RLS policies (TRD §9 — non-negotiable).
-- Layer 1 of tenant isolation: even if app code ships a bug, Postgres
-- refuses to return or modify another tenant's rows.
--
-- Public/anonymous reads do NOT go through these policies — public routes
-- use the service-role key server-side with explicit slug-scoped queries
-- and field allowlists (TRD §9 Layer 3). Anon key gets no access at all.

-- Helper: businesses owned by the current authenticated user.
create or replace function owned_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from businesses where owner_user_id = auth.uid();
$$;

-- businesses ---------------------------------------------------------------
alter table businesses enable row level security;

create policy "owner_select_own_business" on businesses
  for select using (owner_user_id = auth.uid());

create policy "owner_insert_own_business" on businesses
  for insert with check (owner_user_id = auth.uid());

create policy "owner_update_own_business" on businesses
  for update using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- business_allowed_domains ---------------------------------------------------
alter table business_allowed_domains enable row level security;

create policy "owner_all_own_allowed_domains" on business_allowed_domains
  for all using (business_id in (select owned_business_ids()))
  with check (business_id in (select owned_business_ids()));

-- services -------------------------------------------------------------------
alter table services enable row level security;

create policy "owner_all_own_services" on services
  for all using (business_id in (select owned_business_ids()))
  with check (business_id in (select owned_business_ids()));

-- availability_rules ----------------------------------------------------------
alter table availability_rules enable row level security;

create policy "owner_all_own_availability" on availability_rules
  for all using (business_id in (select owned_business_ids()))
  with check (business_id in (select owned_business_ids()));

-- customers --------------------------------------------------------------------
alter table customers enable row level security;

create policy "owner_select_own_customers" on customers
  for select using (business_id in (select owned_business_ids()));

create policy "owner_update_own_customers" on customers
  for update using (business_id in (select owned_business_ids()))
  with check (business_id in (select owned_business_ids()));

-- bookings ------------------------------------------------------------------
alter table bookings enable row level security;

create policy "owner_select_own_bookings" on bookings
  for select using (business_id in (select owned_business_ids()));

create policy "owner_update_own_bookings" on bookings
  for update using (business_id in (select owned_business_ids()))
  with check (business_id in (select owned_business_ids()));

-- notifications_log -----------------------------------------------------------
alter table notifications_log enable row level security;

create policy "owner_select_own_notifications" on notifications_log
  for select using (
    booking_id in (
      select id from bookings
      where business_id in (select owned_business_ids())
    )
  );

-- NOTE: no insert policies for customers/bookings/notifications_log for the
-- anon or authenticated roles — public booking creation happens server-side
-- via the service-role client only (TRD §9 Layer 3). This is deliberate.
