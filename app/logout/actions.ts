"use server";

import { redirect } from "next/navigation";

import { clearSessionPolicyCookies } from "@/lib/auth/session-cookies";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  await clearSessionPolicyCookies();

  redirect("/");
}
