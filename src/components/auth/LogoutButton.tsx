"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleClick() {
    await createClient().auth.signOut();
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-sm text-ink-muted hover:text-ink md:text-ink-soft md:hover:text-paper"
    >
      Log out
    </button>
  );
}
