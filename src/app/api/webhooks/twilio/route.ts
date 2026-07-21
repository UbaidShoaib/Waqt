import { NextRequest, NextResponse } from "next/server";

// Twilio SMS status callback (TRD §8).
// TODO Week 3: validate X-Twilio-Signature before trusting the payload,
// then update the matching notifications_log row.
export async function POST(req: NextRequest) {
  await req.formData(); // Twilio posts application/x-www-form-urlencoded
  return NextResponse.json({ received: true });
}
