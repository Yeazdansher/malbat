"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { isTheme, THEME_COOKIE, type Theme } from "@/lib/theme/config";

export async function updateNotificationsEnabled(
  enabled: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Nicht angemeldet." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ notifications_enabled: enabled })
    .eq("id", user.id);

  if (error) {
    console.error("updateNotificationsEnabled:", error);
    return {
      ok: false,
      error: "Einstellung konnte nicht gespeichert werden.",
    };
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function updateTheme(
  theme: Theme
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isTheme(theme)) {
    return { ok: false, error: "Ungültiges Design." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Nicht angemeldet." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ theme })
    .eq("id", user.id);

  if (error) {
    console.error("updateTheme:", error);
    return {
      ok: false,
      error: "Einstellung konnte nicht gespeichert werden.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
