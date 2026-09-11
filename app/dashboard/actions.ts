"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import type { FamilyRole, InvitationRole } from "@/lib/invitations";
import { createClient } from "@/lib/supabase/server";

type UpdateFamilyResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateFamilyDetails(
  familyId: string,
  name: string,
  description: string
): Promise<UpdateFamilyResult> {
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();

  if (!trimmedName) {
    return { ok: false, error: "Bitte gib einen Namen ein." };
  }

  if (trimmedName.length > 100) {
    return {
      ok: false,
      error: "Der Name darf höchstens 100 Zeichen lang sein.",
    };
  }

  if (trimmedDescription.length > 1000) {
    return {
      ok: false,
      error: "Die Beschreibung darf höchstens 1.000 Zeichen lang sein.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Du bist nicht angemeldet." };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    console.error("updateFamilyDetails (membership):", membershipError);
    return {
      ok: false,
      error: "Der Stammbaum konnte nicht gespeichert werden.",
    };
  }

  if (membership?.role !== "owner") {
    return {
      ok: false,
      error: "Nur der Besitzer darf diesen Stammbaum bearbeiten.",
    };
  }

  const { error: updateError } = await supabase.rpc(
    "update_family_details",
    {
      p_family_id: familyId,
      p_name: trimmedName,
      p_description: trimmedDescription,
    }
  );

  if (updateError) {
    console.error("updateFamilyDetails (families):", updateError);

    const message = updateError.message.toLowerCase();
    if (message.includes("not_owner")) {
      return {
        ok: false,
        error: "Nur der Besitzer darf diesen Stammbaum bearbeiten.",
      };
    }
    if (message.includes("name_required")) {
      return { ok: false, error: "Bitte gib einen Namen ein." };
    }
    if (message.includes("name_too_long")) {
      return {
        ok: false,
        error: "Der Name darf höchstens 100 Zeichen lang sein.",
      };
    }
    if (message.includes("description_too_long")) {
      return {
        ok: false,
        error: "Die Beschreibung darf höchstens 1.000 Zeichen lang sein.",
      };
    }

    return {
      ok: false,
      error: "Der Stammbaum konnte nicht gespeichert werden.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/family/${familyId}`);
  return { ok: true };
}

export type FamilyMember = {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  member_role: FamilyRole;
  joined_at: string;
};

type InvitationResult =
  | {
      ok: true;
      path: string;
      expiresAt: string;
    }
  | { ok: false; error: string };

export async function createFamilyInvitation(
  familyId: string,
  role: InvitationRole
): Promise<InvitationResult> {
  if (role !== "editor" && role !== "viewer") {
    return { ok: false, error: "Bitte wähle eine gültige Rolle aus." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Du bist nicht angemeldet." };
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await supabase.rpc(
    "create_family_invitation",
    {
      p_family_id: familyId,
      p_token_hash: tokenHash,
      p_role: role,
    }
  );

  if (error || !data) {
    console.error("createFamilyInvitation:", error);
    const message = error?.message?.toLowerCase() ?? "";
    if (message.includes("not_owner") || message.includes("not_allowed")) {
      return {
        ok: false,
        error: "Du hast keine Berechtigung, Einladungen zu erstellen.",
      };
    }
    return {
      ok: false,
      error: "Der Einladungslink konnte nicht erstellt werden.",
    };
  }

  return {
    ok: true,
    path: `/invite/${token}`,
    expiresAt: String(data),
  };
}

export async function getFamilyMembers(
  familyId: string
): Promise<
  { ok: true; members: FamilyMember[] } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Du bist nicht angemeldet." };
  }

  const { data, error } = await supabase.rpc("list_family_members", {
    p_family_id: familyId,
  });

  if (error) {
    console.error("getFamilyMembers:", error);
    return {
      ok: false,
      error: "Die Mitglieder konnten nicht geladen werden.",
    };
  }

  return { ok: true, members: (data ?? []) as FamilyMember[] };
}

export async function changeFamilyMemberRole(
  familyId: string,
  userId: string,
  role: InvitationRole
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (role !== "editor" && role !== "viewer") {
    return { ok: false, error: "Ungültige Rolle." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_family_member_role", {
    p_family_id: familyId,
    p_user_id: userId,
    p_role: role,
  });

  if (error) {
    console.error("changeFamilyMemberRole:", error);
    return {
      ok: false,
      error: "Die Rolle konnte nicht geändert werden.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/family/${familyId}`);
  return { ok: true };
}

export async function removeFamilyMember(
  familyId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_family_member", {
    p_family_id: familyId,
    p_user_id: userId,
  });

  if (error) {
    console.error("removeFamilyMember:", error);
    return {
      ok: false,
      error: "Das Mitglied konnte nicht entfernt werden.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/family/${familyId}`);
  return { ok: true };
}
