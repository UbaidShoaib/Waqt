import { beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * RLS / privilege-isolation test suite (TRD §9 Layer 4 — HARD GATE:
 * must be written and passing before any pilot business is onboarded).
 *
 * Runs against a real Supabase project (local `supabase start` or a dev
 * project). Required env: SUPABASE_URL, SUPABASE_ANON_KEY,
 * SUPABASE_SERVICE_ROLE_KEY. Skipped when not configured so `npm test`
 * still passes locally without a database.
 *
 * Structure: create two tenants (A, B) via service role, authenticate as
 * owner A, then attempt to read/update/delete B's rows by ID. Every attempt
 * must fail or return nothing.
 */

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configured = Boolean(url && anonKey && serviceKey);

const d = describe.skipIf(!configured);

d("horizontal isolation: tenant A cannot touch tenant B", () => {
  let admin: SupabaseClient;
  let ownerA: SupabaseClient;
  let bizA: { id: string };
  let bizB: { id: string };
  let serviceB: { id: string };
  let bookingB: { id: string };

  beforeAll(async () => {
    admin = createClient(url!, serviceKey!);

    const mkOwner = async (email: string) => {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: "test-password-123!",
        email_confirm: true,
      });
      if (error) throw error;
      return data.user!;
    };

    const userA = await mkOwner(`rls-a-${Date.now()}@test.waqt.dev`);
    const userB = await mkOwner(`rls-b-${Date.now()}@test.waqt.dev`);

    const mkBiz = async (ownerId: string, slug: string) => {
      const { data, error } = await admin
        .from("businesses")
        .insert({ owner_user_id: ownerId, name: slug, slug, timezone: "UTC", currency: "USD" })
        .select()
        .single();
      if (error) throw error;
      return data;
    };

    bizA = await mkBiz(userA.id, `rls-a-${Date.now()}`);
    bizB = await mkBiz(userB.id, `rls-b-${Date.now()}`);

    const { data: svc } = await admin
      .from("services")
      .insert({ business_id: bizB.id, name: "Cut", duration_min: 30, price_cents: 1000 })
      .select()
      .single();
    serviceB = svc!;

    const { data: cust } = await admin
      .from("customers")
      .insert({ business_id: bizB.id, name: "C", phone: "+10000000000" })
      .select()
      .single();

    const { data: bk } = await admin
      .from("bookings")
      .insert({
        business_id: bizB.id,
        service_id: serviceB.id,
        customer_id: cust!.id,
        starts_at: new Date(Date.now() + 86_400_000).toISOString(),
        ends_at: new Date(Date.now() + 86_400_000 + 1_800_000).toISOString(),
      })
      .select()
      .single();
    bookingB = bk!;

    ownerA = createClient(url!, anonKey!);
    const { error: signInError } = await ownerA.auth.signInWithPassword({
      email: userA.email!,
      password: "test-password-123!",
    });
    if (signInError) throw signInError;
  });

  it("cannot SELECT tenant B's business", async () => {
    const { data } = await ownerA.from("businesses").select().eq("id", bizB.id);
    expect(data ?? []).toHaveLength(0);
  });

  it("cannot SELECT tenant B's services, bookings, customers", async () => {
    for (const table of ["services", "bookings", "customers"]) {
      const { data } = await ownerA.from(table).select().eq("business_id", bizB.id);
      expect(data ?? []).toHaveLength(0);
    }
  });

  it("cannot UPDATE tenant B's booking by ID", async () => {
    const { data } = await ownerA
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingB.id)
      .select();
    expect(data ?? []).toHaveLength(0); // RLS: zero rows affected

    const { data: check } = await admin
      .from("bookings")
      .select("status")
      .eq("id", bookingB.id)
      .single();
    expect(check!.status).toBe("confirmed"); // unchanged
  });

  it("cannot DELETE tenant B's service by ID", async () => {
    await ownerA.from("services").delete().eq("id", serviceB.id);
    const { data: check } = await admin
      .from("services")
      .select("id")
      .eq("id", serviceB.id);
    expect(check).toHaveLength(1); // still there
  });

  it("cannot INSERT into tenant B (spoofed business_id)", async () => {
    const { error } = await ownerA
      .from("services")
      .insert({ business_id: bizB.id, name: "Evil", duration_min: 30, price_cents: 0 });
    expect(error).not.toBeNull(); // with_check policy rejects
  });
});

d("vertical isolation: anonymous role has no direct table access", () => {
  it("anon key cannot read businesses/bookings/customers directly", async () => {
    const anon = createClient(url!, anonKey!);
    for (const table of ["businesses", "bookings", "customers", "services"]) {
      const { data } = await anon.from(table).select().limit(1);
      expect(data ?? []).toHaveLength(0);
    }
  });
});
