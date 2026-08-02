import { getOwnedBusiness } from "@/lib/supabase/server";
import AvailabilityForm from "@/components/dashboard/AvailabilityForm";

export default async function AvailabilityPage() {
  const { business, supabase } = await getOwnedBusiness();
  if (!business) return null;

  const { data: rules } = await supabase
    .from("availability_rules")
    .select("day_of_week, start_time, end_time")
    .eq("business_id", business.id);

  return (
    <>
      <h2 className="text-lg font-medium">Weekly availability</h2>
      <AvailabilityForm initialRules={rules ?? []} />
    </>
  );
}
