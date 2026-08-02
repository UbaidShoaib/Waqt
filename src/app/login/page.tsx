import { redirect } from "next/navigation";
import { getOwnedBusiness } from "@/lib/supabase/server";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const { user, business } = await getOwnedBusiness();
  if (user) redirect(business ? "/dashboard" : "/onboarding");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center space-y-6 p-6">
      <h1 className="text-xl font-semibold">Waqt</h1>
      <LoginForm />
    </main>
  );
}
