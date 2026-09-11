"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(
        "Bitte gib deine E-Mail-Adresse ein."
      )}`
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (!siteUrl) {
    console.error("NEXT_PUBLIC_SITE_URL is missing.");
    redirect(
      `/forgot-password?error=${encodeURIComponent(
        "Die Anfrage konnte nicht verarbeitet werden. Bitte wende dich an den Administrator."
      )}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("requestPasswordReset:", error);
  }

  redirect("/forgot-password?sent=1");
}
