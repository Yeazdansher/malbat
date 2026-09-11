import type { FamilyRole } from "@/lib/invitations";
import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export function canEditFamily(role: FamilyRole): boolean {
  return role === "owner" || role === "editor";
}

export async function requireFamilyEditor(
  supabase: ServerSupabaseClient,
  familyId: string
): Promise<"owner" | "editor"> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  const { data: membership, error } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    error ||
    (membership?.role !== "owner" && membership?.role !== "editor")
  ) {
    throw new Error(
      "Du hast keine Berechtigung, diesen Stammbaum zu bearbeiten."
    );
  }

  return membership.role;
}
