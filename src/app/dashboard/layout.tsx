import { redirect } from "next/navigation";
import { getOwnedBusiness } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { brandStyle } from "@/lib/color";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, business } = await getOwnedBusiness();
  if (!user) redirect("/login");
  if (!business) redirect("/onboarding");

  return (
    <div style={brandStyle(business.brand_color)} className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex min-w-0 flex-col gap-5 bg-ink px-4 py-5 text-paper md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:px-5 md:py-7">
        <div className="flex items-center justify-between gap-3 md:flex-col md:items-start">
          <div className="min-w-0">
            <p className="font-display text-sm text-saffron">Waqt</p>
            <p className="truncate font-display text-xl font-semibold">{business.name}</p>
          </div>
          <a
            href={`/b/${business.slug}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 whitespace-nowrap text-xs font-semibold text-ink-soft underline-offset-4 hover:text-paper hover:underline"
          >
            View booking page ↗
          </a>
        </div>
        <DashboardNav />
        <div className="hidden md:mt-auto md:block">
          <LogoutButton />
        </div>
      </aside>
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-6 md:px-10 md:py-10">
        {children}
        <div className="md:hidden">
          <LogoutButton />
        </div>
      </main>
    </div>
  );
}
