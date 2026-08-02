import { getOwnedBusiness } from "@/lib/supabase/server";
import BrandingForm from "@/components/dashboard/BrandingForm";

export default async function BrandingPage() {
  const { business } = await getOwnedBusiness();
  if (!business) return null;

  return (
    <>
      <h2 className="text-lg font-medium">Branding</h2>
      <BrandingForm
        businessId={business.id}
        initialLogoUrl={business.logo_url}
        initialBrandColor={business.brand_color}
        initialWelcomeMessage={business.welcome_message}
      />
    </>
  );
}
