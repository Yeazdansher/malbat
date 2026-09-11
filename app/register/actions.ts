"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isValidPassword, PASSWORD_REQUIREMENTS } from "@/lib/password";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const emailRedirectTo = invite
    ? `${origin.replace(/\/$/, "")}/auth/callback?invite=${encodeURIComponent(
        invite
      )}`
    : undefined;

  let error: { message: string } | null = null;

  try {
    const result = await supabase.auth.signUp({
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
    error = result.error;
  } catch (caught) {
    console.error("registerUser network:", caught);
    registerError(
      "Verbindung zu Supabase fehlgeschlagen (TLS). Bei Norton Antivirus: HTTPS-Scanning für localhost deaktivieren oder npm run certs:norton ausführen und den Server neu starten.",
      invite
    );
  }

  if (error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("fetch failed") ||
      message.includes("network") ||
      message.includes("failed to fetch") ||
      message.includes("unable_to_verify_leaf_signature")
    ) {
      registerError(
        "Verbindung zu Supabase fehlgeschlagen (TLS). Bei Norton Antivirus: HTTPS-Scanning für localhost deaktivieren oder npm run certs:norton ausführen und den Server neu starten.",
        invite
      );
    }

    if (
      message.includes("already registered") ||
      message.includes("already been registered") ||
      message.includes("user already exists")
    ) {
      registerError(
        "Diese E-Mail ist bereits registriert. Melde dich an oder lösche den Benutzer zuerst unter Authentication → Users.",
        invite
      );
    }

    if (
      message.includes("database error") ||
      message.includes("user_plans") ||
      message.includes("profiles")
    ) {
      registerError(
        "Die Registrierung ist an der Datenbank gescheitert. Bitte führe database/009_user_plans.sql in Supabase aus und versuche es erneut.",
        invite
      );
    }

    registerError(error.message, invite);
  }

  redirect(
    invite
      ? `/register/check-email?invite=${encodeURIComponent(invite)}`
      : "/register/check-email"
  );
}