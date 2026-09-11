"use server";

import { redirect } from "next/navigation";

import { isValidPassword, PASSWORD_REQUIREMENTS } from "@/lib/password";
import { createClient } from "@/lib/supabase/server";

function resetRedirectError(message: string): never {
  redirect(`/reset-password?error=${encodeURIComponent(message)}`);
}

export async function resetPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(
    formData.get("password_confirmation") ?? ""
  );

  if (!isValidPassword(password)) {
    resetRedirectError(PASSWORD_REQUIREMENTS);
  }

  if (password !== confirmation) {
    resetRedirectError(
      "Das neue Passwort und die Bestätigung stimmen nicht überein."
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(
        "Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an."
      )}`
    );
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    console.error("resetPassword:", error);
    resetRedirectError(
      "Das Passwort konnte nicht gespeichert werden. Bitte fordere einen neuen Link an."
    );
  }

  await supabase.auth.signOut();
  redirect("/login?passwordReset=1");
}
