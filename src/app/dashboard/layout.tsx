import { redirect } from "next/navigation";
import Link from "next/link";
import { getOwnedBusiness } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, business } = await getOwnedBusiness();
  if (!user) redirect("/login");
  if (!business) redirect("/onboarding");

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{business.name}</h1>
        <LogoutButton />
      </div>
      <nav className="flex gap-4 text-sm text-slate-600">
        <Link href="/dashboard" className="hover:text-slate-900">
          Bookings
        </Link>
        <Link href="/dashboard/branding" className="hover:text-slate-900">
          Branding
        </Link>
        <Link href="/dashboard/services" className="hover:text-slate-900">
          Services
        </Link>
        <Link href="/dashboard/availability" className="hover:text-slate-900">
          Availability
        </Link>
        <Link href="/dashboard/embed" className="hover:text-slate-900">
          Embed
        </Link>
      </nav>
      {children}
    </main>
  );
}
