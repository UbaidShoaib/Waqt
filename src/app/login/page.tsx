import { redirect } from "next/navigation";
import { getOwnedBusiness } from "@/lib/supabase/server";
import LoginForm from "@/components/auth/LoginForm";
import AuthShell from "@/components/auth/AuthShell";

export default async function LoginPage() {
  const { user, business } = await getOwnedBusiness();
  if (user) redirect(business ? "/dashboard" : "/onboarding");

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your bookings.">
      <LoginForm />
    </AuthShell>
  );
}
