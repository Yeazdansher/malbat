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

  const { data: relationships, error: relationshipsError } = await supabase
    .from("relationships")
    .select("*")
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

  if (error || !family || !membership) {
    return (
      <AppBackdrop>
        <main className="min-h-screen">
          <Header
            backHref="/dashboard"
            backLabel="Dashboard"
            profile={profile}
            glass
          />

          <div className="mx-auto mt-10 max-w-5xl rounded-2xl border border-white/40 bg-white/95 p-10 shadow-lg backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-red-600">
              Familie nicht gefunden
            </h1>
          </div>
        </main>
      </AppBackdrop>
    );
  }

  const planUsage = await getFamilyPlanUsage(id);
  const planLocked = family.plan_locked || planUsage?.planLocked === true;
  const canAddPerson = !planLocked && (planUsage?.canAddPerson ?? true);
  const canEditTree = canEdit && !planLocked;

  if (planLocked) {
    return (
      <AppBackdrop>
        <main className="min-h-screen">
          <Header
            backHref="/dashboard"
            backLabel="Dashboard"
            profile={profile}
            glass
          />

          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/40 bg-white/95 p-10 shadow-lg backdrop-blur-sm">
            <h1 className="text-3xl font-bold text-green-700">
              {family.name}
            </h1>
            <p className="mt-4 text-gray-700">
              Dieser Stammbaum ist durch den Free-Tarif gesperrt. Der
              Besitzer muss Premium aktivieren, damit der Baum wieder
              geöffnet werden kann.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-lg border px-5 py-3 hover:bg-gray-100"
              >
                Zum Dashboard
              </Link>
              {isOwner && (
                <Link
                  href="/profile#plan"
                  className="rounded-lg bg-[#1f7a45] px-5 py-3 font-semibold text-white hover:bg-[#19653a]"
                >
                  Tarif verwalten
                </Link>
              )}
            </div>
          </div>
        </main>
      </AppBackdrop>
    );
  }

  return (
    <AppBackdrop imageSrc="/landing/tree-bg.jpg" muted>
      <FamilyTreeEntrance familyName={family.name}>
        <main className="min-h-screen pb-10">
          <Header
            backHref="/dashboard"
            backLabel="Dashboard"
            profile={profile}
            glass
          />

          <div className="mx-auto mt-8 max-w-7xl px-6">
            <div className="mb-8">
              <h1
                className="text-4xl font-semibold text-white"
                style={{ fontFamily: "var(--font-malbat), serif" }}
              >
                {family.name}
              </h1>

              {planUsage?.ownerPlanCode === "free" &&
                planUsage.maxPersons !== null && (
                  <p className="mt-1 text-sm text-white/75">
                    {planUsage.personCount}/{planUsage.maxPersons} Personen
                  </p>
                )}
            </div>

            {actionError === "person-limit" && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/95 px-4 py-3 text-amber-900 shadow-sm">
                {isOwner
                  ? "Personenlimit erreicht. Weitere Personen sind mit Premium möglich."
                  : "Das Personenlimit des Besitzers ist erreicht."}
              </div>
            )}

            {(personsError || relationshipsError) && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50/95 px-4 py-3 text-red-900 shadow-sm">
                Stammbaum-Daten konnten nicht geladen werden
                {personsError ? `: ${personsError.message}` : ""}
                {relationshipsError
                  ? `: ${relationshipsError.message}`
                  : ""}
              </div>
            )}

            <div className="rounded-2xl border border-white/30 bg-white/92 p-4 shadow-xl backdrop-blur-sm sm:p-6">
              <FamilyTree
                familyId={family.id}
                persons={persons ?? []}
                relationships={relationships ?? []}
                canEdit={canEditTree}
                canAddPerson={canAddPerson}
              />
            </div>
          </div>
        </main>
      </FamilyTreeEntrance>
    </AppBackdrop>
  );
}
