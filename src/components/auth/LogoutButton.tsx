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
      className="text-sm text-slate-500 hover:text-slate-700"
    >
      Log out
    </button>
  );
}
