import Link from "next/link";
import { redirect } from "next/navigation";

import AppBackdrop from "@/components/AppBackdrop";
import Header from "@/components/Header";
import FamilyTree from "@/components/family/FamilyTree";
import FamilyTreeEntrance from "@/components/family/FamilyTreeEntrance";
import { canEditFamily } from "@/lib/family-permissions";
import type { FamilyRole } from "@/lib/invitations";
import { getFamilyPlanUsage } from "@/lib/plans";
import { getCurrentProfile } from "@/lib/profile";
import { getTranslator } from "@/lib/i18n/server";
import { findMissingSiblingParentLinks } from "@/lib/sibling-parent-sync";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function FamilyPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { error: actionError } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  const tCommon = await getTranslator("common");
  const tTree = await getTranslator("tree");
  const tExtras = await getTranslator("treeExtras");

  const { data: family, error } = await supabase
    .from("families")
    .select("id, name, description, plan_locked")
    .eq("id", id)
    .single();

  const { data: persons, error: personsError } = await supabase
    .from("persons")
    .select("*")
    .eq("family_id", id)
    .order("created_at");

  let { data: relationships, error: relationshipsError } = await supabase
    .from("relationships")
    .select("*")
    .eq("family_id", id);

  const { data: layoutOverrideRows } = await supabase
    .from("family_layout_overrides")
    .select("node_id, pos_x, pos_y")
    .eq("family_id", id);

  const { data: membership } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const role = membership?.role as FamilyRole | undefined;
  const isOwner = role === "owner";
  const canEdit = role ? canEditFamily(role) : false;

  if (canEdit && relationships && relationships.length > 0) {
    const missing = findMissingSiblingParentLinks(id, relationships);
    if (missing.length > 0) {
      const { error: syncError } = await supabase
        .from("relationships")
        .insert(missing);
      if (!syncError) {
        const refreshed = await supabase
          .from("relationships")
          .select("*")
          .eq("family_id", id);
        relationships = refreshed.data ?? relationships;
        relationshipsError = refreshed.error;
      }
    }
  }

  if (error || !family || !membership) {
    return (
      <AppBackdrop>
        <main className="min-h-screen">
          <Header
            backHref="/dashboard"
            backLabel={tCommon("dashboard")}
            profile={profile}
          />

          <div className="mx-auto mt-10 max-w-5xl rounded-2xl border bg-white p-10 shadow-lg">
            <h1 className="text-2xl font-bold text-red-600">
              {tTree("notFound")}
            </h1>
          </div>
        </main>
      </AppBackdrop>
    );
  }

  const planUsage = await getFamilyPlanUsage(id);
  const locked =
    family.plan_locked || planUsage?.planLocked === true;
  const canAddPerson = !locked && (planUsage?.canAddPerson ?? true);
  const canEditTree = canEdit && !locked;

  if (locked) {
    return (
      <AppBackdrop>
        <main className="min-h-screen">
          <Header
            backHref="/dashboard"
            backLabel={tCommon("dashboard")}
            profile={profile}
          />

          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border bg-white p-10 shadow-lg">
            <h1 className="text-3xl font-bold text-green-700">
              {family.name}
            </h1>
            <p className="mt-4 text-gray-700">{tTree("lockedBody")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-lg border px-5 py-3 hover:bg-gray-100"
              >
                {tTree("toDashboard")}
              </Link>
              {isOwner && (
                <Link
                  href="/profile#plan"
                  className="rounded-lg bg-[#1f7a45] px-5 py-3 font-semibold text-white hover:bg-[#19653a]"
                >
                  {tTree("managePlan")}
                </Link>
              )}
            </div>
          </div>
        </main>
      </AppBackdrop>
    );
  }

  return (
    <FamilyTreeEntrance
      key={family.id}
      familyId={family.id}
      familyName={family.name}
    >
      <div className="flex h-dvh flex-col overflow-hidden bg-white">
        <Header
          backHref="/dashboard"
          backLabel={tCommon("dashboard")}
          profile={profile}
        />

        {(actionError === "person-limit" ||
          personsError ||
          relationshipsError) && (
          <div className="shrink-0 space-y-2 px-4 pt-3">
            {actionError === "person-limit" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                {isOwner
                  ? tTree("personLimitOwner")
                  : tTree("personLimitMember")}
              </div>
            )}
            {(personsError || relationshipsError) && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900">
                {tTree("loadError")}
                {personsError ? `: ${personsError.message}` : ""}
                {relationshipsError
                  ? `: ${relationshipsError.message}`
                  : ""}
              </div>
            )}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          <FamilyTree
            familyId={family.id}
            familyName={family.name}
            personLimitLabel={
              planUsage?.ownerPlanCode === "free" &&
              planUsage.maxPersons !== null
                ? tExtras("personsLimit", {
                    current: planUsage.personCount,
                    max: planUsage.maxPersons,
                  })
                : null
            }
            persons={persons ?? []}
            relationships={relationships ?? []}
            layoutOverrides={Object.fromEntries(
              (layoutOverrideRows ?? []).map((row) => [
                row.node_id,
                { x: row.pos_x, y: row.pos_y },
              ])
            )}
            canEdit={canEditTree}
            canAddPerson={canAddPerson}
          />
        </div>
      </div>
    </FamilyTreeEntrance>
  );
}
