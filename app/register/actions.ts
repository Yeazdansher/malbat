"use server";

import { redirect } from "next/navigation";
import { isValidPassword, PASSWORD_REQUIREMENTS } from "@/lib/password";
import { getSiteUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function registerError(message: string, invite: string): never {
  const inviteQuery = invite
    ? `&invite=${encodeURIComponent(invite)}`
    : "";
  redirect(
    `/register?error=${encodeURIComponent(message)}${inviteQuery}`
  );
}

function mapSignUpErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid supabaseurl") || lower.includes("must be a valid http")) {
    return "NEXT_PUBLIC_SUPABASE_URL in Vercel ist ungültig. Bitte https://dein-projekt.supabase.co ohne Anführungszeichen setzen und neu deployen.";
  }

  if (
    lower.includes("fetch failed") ||
    lower.includes("network") ||
    lower.includes("failed to fetch") ||
    lower.includes("unable_to_verify_leaf_signature")
  ) {
    return "Verbindung zu Supabase fehlgeschlagen. Bitte später erneut versuchen.";
  }

  if (
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("user already exists")
  ) {
    return "Diese E-Mail ist bereits registriert. Bitte melde dich an.";
  }

  if (lower.includes("rate limit") || lower.includes("email rate limit")) {
    return "Zu viele E-Mail-Anfragen. Bitte warte einige Minuten und versuche es erneut.";
  }

  if (
    lower.includes("database error") ||
    lower.includes("user_plans") ||
    lower.includes("profiles") ||
    lower.includes("duplicate") ||
    lower.includes("unique")
  ) {
    return "Die Registrierung ist an der Datenbank gescheitert. Benutzername ggf. schon vergeben, oder fehlende Migrationen in Supabase prüfen.";
  }

  return message;
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

  let failureMessage: string | null = null;

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
      failureMessage = mapSignUpErrorMessage(error.message);
    }
  } catch (caught) {
    console.error("registerUser:", caught);

    if (
      caught instanceof Error &&
      caught.message.startsWith("MISSING_SUPABASE_ENV")
    ) {
      failureMessage =
        "Server-Konfiguration unvollständig (Supabase-Env). Bitte Administrator kontaktieren.";
    } else if (
      caught instanceof Error &&
      caught.message.startsWith("INVALID_SUPABASE_URL")
    ) {
      failureMessage =
        "NEXT_PUBLIC_SUPABASE_URL in Vercel ist ungültig. Bitte https://dein-projekt.supabase.co ohne Anführungszeichen setzen und neu deployen.";
    } else if (caught instanceof Error && caught.message) {
      failureMessage = mapSignUpErrorMessage(caught.message);
    } else {
      failureMessage =
        "Die Registrierung ist fehlgeschlagen. Bitte später erneut versuchen.";
    }
  }

  if (failureMessage) {
    registerError(failureMessage, invite);
  }

  redirect(
    invite
      ? `/register/check-email?invite=${encodeURIComponent(invite)}`
      : "/register/check-email"
  );
}
