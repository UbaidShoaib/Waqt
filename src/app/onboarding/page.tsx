import { redirect } from "next/navigation";
import { getOwnedBusiness } from "@/lib/supabase/server";
import OnboardingForm from "@/components/auth/OnboardingForm";
import AuthShell from "@/components/auth/AuthShell";

export default async function OnboardingPage() {
  const { user, business } = await getOwnedBusiness();
  if (!user) redirect("/login");
  if (business) redirect("/dashboard");

  return (
    <AuthShell title="Set up your business" subtitle="This is what customers will see on your booking page.">
      <OnboardingForm />
    </AuthShell>
  );
}
