import { NextResponse, type NextRequest } from "next/server";

import { getTranslator } from "@/lib/i18n/server";
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

  if (next === "/reset-password") {
    const tForgot = await getTranslator("forgotPassword");
    errorUrl.searchParams.set("error", tForgot("linkInvalid"));
  } else {
    const tLogin = await getTranslator("login");
    errorUrl.searchParams.set("error", tLogin("emailConfirmFailed"));
  }

  if (invite) {
    errorUrl.searchParams.set("invite", invite);
  }

  return NextResponse.redirect(errorUrl);
}
