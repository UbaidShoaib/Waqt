import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPublicBusinessBySlug } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import BookingFlow from "@/components/BookingFlow";
import { brandStyle } from "@/lib/color";

// Iframe-optimized booking page (TRD Flow C, §11): no chrome, same public
// data surface as /b/[slug] — must NOT expose anything wider (TRD §9 Layer 3).
// CSP frame-ancestors + Origin check happen in middleware.ts; a blocked
// request reaches here with x-waqt-embed-blocked=1.
export default async function EmbedPage({
  params,
}: {
  params: { slug: string };
}) {
  const result = await getPublicBusinessBySlug(params.slug);
  if (!result) notFound();
  const { business, services } = result;

  const blocked = headers().get("x-waqt-embed-blocked") === "1";
  if (blocked) {
    // TRD §11.5: owner's own authenticated dashboard preview bypasses the
    // whitelist — only when the session belongs to THIS business's owner.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isOwnerPreview = false;
    if (user) {
      const { data: owned } = await supabase
        .from("businesses")
        .select("id")
        .eq("id", business.id)
        .eq("owner_user_id", user.id)
        .maybeSingle();
      isOwnerPreview = Boolean(owned);
    }

    if (!isOwnerPreview) {
      return (
        <main className="flex min-h-screen items-center justify-center p-6 text-center">
          <p className="text-sm text-ink-muted">
            This booking widget isn’t authorized on this website. If you own
            this business, add this domain in your Waqt dashboard under Embed.
          </p>
        </main>
      );
    }
  }

  return (
    <main
      style={brandStyle(business.brand_color)}
    >
      <BookingFlow business={business} services={services} source="widget" />
      {/* TODO Week 4: height auto-resize — post document height to parent on
          load + resize: window.parent.postMessage({type:"waqt:resize",height},"*") */}
    </main>
  );
}
