import { cookies } from "next/headers";

import {
  IDLE_TIMEOUT_MS,
  LAST_ACTIVE_COOKIE,
  PERSIST_COOKIE,
  PERSIST_MAX_AGE_SEC,
} from "@/lib/auth/session-policy";

const secure = process.env.NODE_ENV === "production";

export async function setSessionPolicyCookies(remember: boolean) {
  const cookieStore = await cookies();
  const now = Date.now();

  if (remember) {
    cookieStore.set(PERSIST_COOKIE, "1", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: PERSIST_MAX_AGE_SEC,
    });
    cookieStore.delete(LAST_ACTIVE_COOKIE);
    return;
  }

  cookieStore.set(PERSIST_COOKIE, "0", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.ceil(IDLE_TIMEOUT_MS / 1000) + 60,
  });
  cookieStore.set(LAST_ACTIVE_COOKIE, String(now), {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.ceil(IDLE_TIMEOUT_MS / 1000) + 60,
  });
}

export async function clearSessionPolicyCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(PERSIST_COOKIE);
  cookieStore.delete(LAST_ACTIVE_COOKIE);
}
