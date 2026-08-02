import { redirect } from "next/navigation";
import { getOwnedBusiness } from "@/lib/supabase/server";
import OnboardingForm from "@/components/auth/OnboardingForm";

export default async function OnboardingPage() {
  const { user, business } = await getOwnedBusiness();
  if (!user) redirect("/login");
  if (business) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-sm space-y-6 p-6">
      <h1 className="text-xl font-semibold">Set up your business</h1>
      <OnboardingForm />
    </main>
  );
}
