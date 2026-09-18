"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

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
