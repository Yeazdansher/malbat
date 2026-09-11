"use server";

import { redirect } from "next/navigation";
import { isValidPassword, PASSWORD_REQUIREMENTS } from "@/lib/password";
import { getSiteUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

function registerError(message: string, invite: string): never {
  const inviteQuery = invite
    ? `&invite=${encodeURIComponent(invite)}`
    : "";
  redirect(
    `/register?error=${encodeURIComponent(message)}${inviteQuery}`
  );
}

export async function registerUser(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const rawInvite = String(formData.get("invite") ?? "");
  const invite = /^[A-Za-z0-9_-]{43}$/.test(rawInvite)
    ? rawInvite
    : "";

  if (!firstName || !lastName || !username || !email || !password) {
    registerError("Bitte alle Pflichtfelder ausfüllen.", invite);
  }

  if (password !== confirmPassword) {
    registerError("Die Passwörter stimmen nicht überein.", invite);
  }

  if (!isValidPassword(password)) {
    registerError(PASSWORD_REQUIREMENTS, invite);
  }

  try {
    const supabase = await createClient();
    const siteUrl = getSiteUrl();
    const emailRedirectTo = invite
      ? `${siteUrl}/auth/callback?invite=${encodeURIComponent(invite)}`
      : `${siteUrl}/auth/callback`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          username,
        },
        emailRedirectTo,
      },
    });

    if (error) {
      const message = error.message.toLowerCase();

      if (
        message.includes("fetch failed") ||
        message.includes("network") ||
        message.includes("failed to fetch") ||
        message.includes("unable_to_verify_leaf_signature")
      ) {
        registerError(
          "Verbindung zu Supabase fehlgeschlagen. Bitte später erneut versuchen.",
          invite
        );
      }

      if (
        message.includes("already registered") ||
        message.includes("already been registered") ||
        message.includes("user already exists")
      ) {
        registerError(
          "Diese E-Mail ist bereits registriert. Bitte melde dich an.",
          invite
        );
      }

      if (
        message.includes("database error") ||
        message.includes("user_plans") ||
        message.includes("profiles") ||
        message.includes("duplicate") ||
        message.includes("unique")
      ) {
        registerError(
          "Die Registrierung ist an der Datenbank gescheitert. Benutzername ggf. schon vergeben, oder fehlende Migrationen in Supabase prüfen.",
          invite
        );
      }

      registerError(error.message, invite);
    }
  } catch (caught) {
    if (isNextRedirectError(caught)) {
      throw caught;
    }

    console.error("registerUser:", caught);

    if (
      caught instanceof Error &&
      caught.message.startsWith("MISSING_SUPABASE_ENV")
    ) {
      registerError(
        "Server-Konfiguration unvollständig (Supabase-Env). Bitte Administrator kontaktieren.",
        invite
      );
    }

    registerError(
      "Die Registrierung ist fehlgeschlagen. Bitte später erneut versuchen.",
      invite
    );
  }

  redirect(
    invite
      ? `/register/check-email?invite=${encodeURIComponent(invite)}`
      : "/register/check-email"
  );
}
