"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Bookings" },
  { href: "/dashboard/services", label: "Services" },
  { href: "/dashboard/availability", label: "Hours" },
  { href: "/dashboard/branding", label: "Branding" },
  { href: "/dashboard/embed", label: "Embed" },
];

export default function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto md:flex-col">
      {LINKS.map((l) => {
        const active = l.href === "/dashboard" ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-10 shrink-0 items-center rounded-pill px-4 text-sm transition ${
              active ? "bg-brand font-semibold text-brand-fg" : "text-ink-soft hover:bg-paper/10 hover:text-paper"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
