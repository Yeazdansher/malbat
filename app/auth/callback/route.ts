import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next");
  const next = requestedNext === "/reset-password"
    ? requestedNext
    : "/dashboard";
  const rawInvite = request.nextUrl.searchParams.get("invite") ?? "";
  const invite = TOKEN_PATTERN.test(rawInvite) ? rawInvite : "";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(
        new URL(invite ? `/invite/${invite}` : next, request.url)
      );
    }

    console.error("Auth callback:", error);
  }

  const errorUrl = new URL(
    next === "/reset-password" ? "/forgot-password" : "/login",
    request.url
  );
  errorUrl.searchParams.set(
    "error",
    next === "/reset-password"
      ? "Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an."
      : "Die E-Mail-Bestätigung ist fehlgeschlagen. Bitte melde dich an."
  );

  if (invite) {
    errorUrl.searchParams.set("invite", invite);
  }

  return NextResponse.redirect(errorUrl);
}
