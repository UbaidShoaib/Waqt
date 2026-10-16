import { notFound } from "next/navigation";
import { getPublicBusinessBySlug } from "@/lib/supabase/admin";
import BookingFlow from "@/components/BookingFlow";
import { brandStyle } from "@/lib/color";

// Public booking page (TRD Flow B): waqt.io/b/{slug}, no customer login,
// themed with the tenant's branding via CSS custom properties (TRD §10).
export default async function BookingPage({
  params,
}: {
  params: { slug: string };
}) {
  const result = await getPublicBusinessBySlug(params.slug);
  if (!result) notFound();

  const { business, services } = result;

  return (
    <main
      style={brandStyle(business.brand_color)}
    >
      <BookingFlow
        business={business}
        services={services}
        source="direct_link"
      />
    </main>
  );
}
