import { createClient } from "@/lib/supabase/server";

export type PlanCode = "free" | "premium";

export type PlanUsage = {
  planCode: PlanCode;
  status: "active" | "payment_required" | "canceled";
  source: "default" | "early_access" | "stripe";
  ownedFamiliesCount: number;
  ownedPersonsCount: number;
  maxOwnedFamilies: number | null;
  maxPersonsPerOwnedFamily: number | null;
};

export type FamilyPlanUsage = {
  ownerPlanCode: PlanCode;
  currentUserRole: "owner" | "editor" | "viewer";
  personCount: number;
  maxPersons: number | null;
  canAddPerson: boolean;
  planLocked: boolean;
};

type DatabaseError = {
  message?: string;
  details?: string;
  hint?: string;
};

function errorText(error: DatabaseError | null): string {
  return [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(" ");
}

export function isOwnedFamilyLimitError(
  error: DatabaseError | null
): boolean {
  return errorText(error).includes("PLAN_OWNED_FAMILY_LIMIT");
}

export function isPersonLimitError(
  error: DatabaseError | null
): boolean {
  return errorText(error).includes("PLAN_PERSON_LIMIT");
}

export function personLimitMessage(
  role: "owner" | "editor"
): string {
  return role === "owner"
    ? "Dein Free-Tarif erlaubt maximal 50 Personen in diesem Stammbaum. Aktiviere Premium, um weitere Personen anzulegen."
    : "Das Personenlimit des Besitzers ist erreicht. Der Besitzer muss Premium aktivieren, bevor weitere Personen angelegt werden können.";
}

export async function getCurrentPlanUsage(): Promise<PlanUsage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_plan_usage");

  if (error) {
    console.error("getCurrentPlanUsage:", error);
    return null;
  }

  const usage = data?.[0];
  if (!usage) {
    return null;
  }

  return {
    planCode: usage.plan_code as PlanCode,
    status: usage.plan_status as PlanUsage["status"],
    source: usage.plan_source as PlanUsage["source"],
    ownedFamiliesCount: Number(usage.owned_families_count),
    ownedPersonsCount: Number(usage.owned_persons_count),
    maxOwnedFamilies: usage.max_owned_families,
    maxPersonsPerOwnedFamily:
      usage.max_persons_per_owned_family,
  };
}

export async function getFamilyPlanUsage(
  familyId: string
): Promise<FamilyPlanUsage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_family_plan_usage", {
    p_family_id: familyId,
  });

  if (error) {
    console.error("getFamilyPlanUsage:", error);
    return null;
  }

  const usage = data?.[0];
  if (!usage) {
    return null;
  }

  return {
    ownerPlanCode: usage.owner_plan_code as PlanCode,
    currentUserRole:
      usage.current_user_role as FamilyPlanUsage["currentUserRole"],
    personCount: Number(usage.person_count),
    maxPersons: usage.max_persons,
    canAddPerson: usage.can_add_person,
    planLocked: Boolean(usage.plan_locked),
  };
}
