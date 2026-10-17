import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedBusiness } from "@/lib/supabase/server";
import { notifyBooking } from "@/lib/messaging/notify";

const updateBookingSchema = z.object({
  status: z.enum(["cancelled", "completed", "no_show"]).optional(),
  payment_status: z.enum(["unpaid", "paid"]).optional(),
});

// PATCH /api/bookings/:id — owner cancel / complete / mark paid (TRD Flow D).
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, business, supabase } = await getOwnedBusiness();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!business) return NextResponse.json({ error: "no business" }, { status: 404 });

  const parsed = updateBookingSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bookings")
    .update(parsed.data)
    .eq("id", params.id)
    .eq("business_id", business.id) // explicit, on top of RLS
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (parsed.data.status === "cancelled") await notifyBooking(data.id, "cancellation");

  return NextResponse.json(data);
}
