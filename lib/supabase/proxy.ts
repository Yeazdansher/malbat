import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  IDLE_TIMEOUT_MS,
  LAST_ACTIVE_COOKIE,
  PERSIST_COOKIE,
  PERSIST_MAX_AGE_SEC,
  isAuthMarketingPath,
  isPersistEnabled,
} from "@/lib/auth/session-policy";

function applyAuthCookieOptions(
  options: Record<string, unknown> | undefined,
  persist: boolean
) {
  const next = { ...(options ?? {}) } as Record<string, unknown>;
  if (persist) {
    if (typeof next.maxAge !== "number") {
      next.maxAge = PERSIST_MAX_AGE_SEC;
    }
    return next;
  }
  // Temporary session: browser-session cookies (cleared on close).
  delete next.maxAge;
  delete next.expires;
  return next;
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Set them in Vercel and redeploy."
    );
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const persist = isPersistEnabled(
    request.cookies.get(PERSIST_COOKIE)?.value
  );

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              applyAuthCookieOptions(
                options as Record<string, unknown> | undefined,
                persist
              )
            )
          );
        },
      },
    });

    // Refresh / validate session cookies.
    await supabase.auth.getClaims();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const pathname = request.nextUrl.pathname;

      // Idle logout when not "Angemeldet bleiben".
      if (
        request.cookies.get(PERSIST_COOKIE)?.value === "0"
      ) {
        const raw = request.cookies.get(LAST_ACTIVE_COOKIE)?.value;
        const last = raw ? Number(raw) : NaN;
        if (Number.isFinite(last) && Date.now() - last >= IDLE_TIMEOUT_MS) {
          await supabase.auth.signOut();
          supabaseResponse.cookies.set(PERSIST_COOKIE, "", {
            path: "/",
            maxAge: 0,
          });
          supabaseResponse.cookies.set(LAST_ACTIVE_COOKIE, "", {
            path: "/",
            maxAge: 0,
          });

          const loginUrl = request.nextUrl.clone();
          loginUrl.pathname = "/login";
          loginUrl.search = "";
          const redirectResponse = NextResponse.redirect(loginUrl);
          supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value);
          });
          return redirectResponse;
        }

        // Keep temp-session cookies alive while the user is active.
        const tempMaxAge = Math.ceil(IDLE_TIMEOUT_MS / 1000) + 60;
        const secure = process.env.NODE_ENV === "production";
        supabaseResponse.cookies.set(PERSIST_COOKIE, "0", {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure,
          maxAge: tempMaxAge,
        });
        supabaseResponse.cookies.set(LAST_ACTIVE_COOKIE, String(Date.now()), {
          path: "/",
          sameSite: "lax",
          secure,
          maxAge: tempMaxAge,
        });
      }

      // Logged-in users skip start / login / register.
      if (isAuthMarketingPath(pathname)) {
        const invite = request.nextUrl.searchParams.get("invite");
        const target = request.nextUrl.clone();
        if (invite && /^[A-Za-z0-9_-]{43}$/.test(invite)) {
          target.pathname = `/invite/${invite}`;
          target.search = "";
        } else {
          target.pathname = "/dashboard";
          target.search = "";
        }
        const redirectResponse = NextResponse.redirect(target);
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value);
        });
        return redirectResponse;
      }
    }
  } catch (error) {
    console.error("Supabase session update failed in proxy:", error);
  }

  return supabaseResponse;
}
