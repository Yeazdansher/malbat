"use server";

import { createClient } from "@/lib/supabase/server";
import type { LayoutOverrideMap } from "@/lib/layout-overrides";

export type FamilyTreeSnapshot = {
  familyId: string;
  familyName: string;
  persons: Array<{
    id: string;
    family_id: string;
    first_name: string;
    last_name: string;
    gender: "male" | "female" | "unknown";
    birth_date: string | null;
    birth_place: string | null;
    is_deceased: boolean;
    death_date: string | null;
    death_place: string | null;
    notes: string | null;
    photo_url?: string | null;
  }>;
  relationships: Array<{
    id: string;
    family_id: string;
    person1_id: string;
    person2_id: string;
    relationship_type:
      | "father"
      | "mother"
      | "partner"
      | "sibling"
      | "parent"
      | "adoptive-parent";
  }>;
  layoutOverrides: LayoutOverrideMap;
};

export async function loadFamilyTreeSnapshot(
  familyId: string
): Promise<
  | { ok: true; data: FamilyTreeSnapshot }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Nicht angemeldet." };
  }

  const { data: membership } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return { ok: false, error: "Kein Zugriff." };
  }

  const { data: family } = await supabase
    .from("families")
    .select("id, name")
    .eq("id", familyId)
    .single();

  if (!family) {
    return { ok: false, error: "Stammbaum nicht gefunden." };
  }

  const { data: persons, error: personsError } = await supabase
    .from("persons")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at");

  if (personsError) {
    return { ok: false, error: "Personen konnten nicht geladen werden." };
  }

  const { data: relationships, error: relationshipsError } = await supabase
    .from("relationships")
    .select("*")
    .eq("family_id", familyId);

  if (relationshipsError) {
    return { ok: false, error: "Beziehungen konnten nicht geladen werden." };
  }

  const { data: layoutOverrideRows } = await supabase
    .from("family_layout_overrides")
    .select("node_id, pos_x, pos_y")
    .eq("family_id", familyId);

  return {
    ok: true,
    data: {
      familyId: family.id,
      familyName: family.name,
      persons: persons ?? [],
      relationships: relationships ?? [],
      layoutOverrides: Object.fromEntries(
        (layoutOverrideRows ?? []).map((row) => [
          row.node_id,
          { x: row.pos_x, y: row.pos_y },
        ])
      ),
    },
  };
}
