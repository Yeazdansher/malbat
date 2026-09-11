import { createClient } from "@/lib/supabase/server";
import type { ExportFamilyPayload } from "@/lib/export/types";

export async function loadFamilyExportPayload(
  familyId: string
): Promise<ExportFamilyPayload> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("NOT_AUTHENTICATED");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    throw new Error("FORBIDDEN");
  }

  const { data: family, error: familyError } = await supabase
    .from("families")
    .select("id, name, description")
    .eq("id", familyId)
    .single();

  if (familyError || !family) {
    throw new Error("NOT_FOUND");
  }

  const { data: persons, error: personsError } = await supabase
    .from("persons")
    .select(
      "id, first_name, last_name, gender, birth_date, birth_place, is_deceased, death_date, death_place, notes"
    )
    .eq("family_id", familyId)
    .order("created_at");

  if (personsError) {
    throw new Error("PERSONS_LOAD_FAILED");
  }

  const { data: relationships, error: relationshipsError } = await supabase
    .from("relationships")
    .select("id, person1_id, person2_id, relationship_type")
    .eq("family_id", familyId);

  if (relationshipsError) {
    throw new Error("RELATIONSHIPS_LOAD_FAILED");
  }

  return {
    family: {
      id: family.id,
      name: family.name,
      description: family.description,
    },
    persons: persons ?? [],
    relationships: relationships ?? [],
    exportedAt: new Date().toISOString(),
  };
}

export function exportFilename(familyName: string, extension: string): string {
  const safe = familyName
    .trim()
    .replace(/[^\p{L}\p{N}\-_ ]+/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);

  return `${safe || "stammbaum"}.${extension}`;
}
