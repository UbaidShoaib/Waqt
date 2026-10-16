-- 0003: overlap-proof bookings, messaging consent, and erasure support.

-- 1. Double-booking guard. The 0001 unique index only caught bookings with the
--    exact same start time; 10:00–11:00 and 10:30–11:30 both got through.
--    An exclusion constraint rejects any overlapping confirmed range
--    (SQLSTATE 23P01).
create extension if not exists btree_gist;

drop index if exists bookings_no_overlap_guard;

alter table bookings
  add constraint bookings_no_overlap
  exclude using gist (
    business_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status = 'confirmed');

-- 2. Messaging consent (WhatsApp Business Policy, TCPA/PECR). Stores when
--    consent was given and which wording was shown, so it can be proven later.
alter table customers
  add column messaging_consent_at timestamptz,
  add column consent_text_version text,
  add column opted_out_at timestamptz;

-- 3. Right to erasure. Deleting a customer removes their bookings (and the
--    notification log via its existing cascade). Deleting an auth user
--    removes their business and everything under it.
alter table bookings
  drop constraint bookings_customer_id_fkey,
  add constraint bookings_customer_id_fkey
    foreign key (customer_id) references customers (id) on delete cascade;

alter table businesses
  drop constraint businesses_owner_user_id_fkey,
  add constraint businesses_owner_user_id_fkey
    foreign key (owner_user_id) references auth.users (id) on delete cascade;

create policy "owner_delete_own_customers" on customers
  for delete using (business_id in (select owned_business_ids()));
