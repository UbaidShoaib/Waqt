import { NextRequest, NextResponse } from "next/server";

// WhatsApp Cloud API webhook (delivery status callbacks, TRD §8).
// GET = Meta's verification handshake; POST = status updates.
// TODO Week 3: validate X-Hub-Signature-256 against the app secret before
// trusting any payload, then update notifications_log rows.

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "verification failed" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  await req.json(); // TODO Week 3: verify signature + process statuses
  return NextResponse.json({ received: true });
}
