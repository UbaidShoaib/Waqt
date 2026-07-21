import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waqt — booking for service businesses",
  description:
    "Branded booking pages and embeddable widgets for service SMBs, with automated WhatsApp/SMS/email reminders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
