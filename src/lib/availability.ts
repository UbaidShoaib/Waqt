import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeSlots, zonedDayRangeUtc, type Slot } from "@/lib/slots";

/**
 * Open slots for one business-local date. Shared by the public slots route
 * and booking creation so the server only accepts times it would offer.
 */
export async function getOpenSlots(
  admin: SupabaseClient,
  opts: { businessId: string; timezone: string; durationMin: number; date: string }
): Promise<Slot[]> {
  const { start, end } = zonedDayRangeUtc(opts.date, opts.timezone);

  const [{ data: rules }, { data: existing }] = await Promise.all([
    admin
      .from("availability_rules")
      .select("day_of_week, start_time, end_time")
      .eq("business_id", opts.businessId),
    // Any confirmed booking overlapping the local day, including one that
    // starts the evening before and runs past midnight.
    admin
      .from("bookings")
      .select("starts_at, ends_at")
      .eq("business_id", opts.businessId)
      .eq("status", "confirmed")
      .lt("starts_at", end.toISOString())
      .gt("ends_at", start.toISOString()),
  ]);

  return computeSlots({
    date: opts.date,
    timezone: opts.timezone,
    durationMin: opts.durationMin,
    rules: rules ?? [],
    existing: existing ?? [],
  });
}
