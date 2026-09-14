"use server";

import { redirect } from "next/navigation";

import { setSessionPolicyCookies } from "@/lib/auth/session-cookies";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "1";
  const invite = String(formData.get("invite") ?? "");
  const inviteQuery = /^[A-Za-z0-9_-]{43}$/.test(invite)
    ? `&invite=${encodeURIComponent(invite)}`
    : "";

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(
        "E-Mail oder Passwort ist falsch."
      )}${inviteQuery}`
    );
  }

  await setSessionPolicyCookies(remember);

  if (inviteQuery) {
    redirect(`/invite/${invite}`);
  }

  redirect("/dashboard");
}
