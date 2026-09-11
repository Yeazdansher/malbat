import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/components/Header";
import FamilyTree from "@/components/family/FamilyTree";
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

  const { data: persons } = await supabase
    .from("persons")
    .select("*")
    .eq("family_id", id)
    .order("created_at");

  const { data: relationships } = await supabase
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
      <main className="min-h-screen bg-gray-100">
        <Header
          backHref="/dashboard"
          backLabel="Dashboard"
          profile={profile}
        />

        <div className="mx-auto mt-10 max-w-5xl rounded-2xl bg-white p-10 shadow">
          <h1 className="text-2xl font-bold text-red-600">
            Familie nicht gefunden
          </h1>
        </div>
      </main>
    );
  }

  const planUsage = await getFamilyPlanUsage(id);
  const planLocked = family.plan_locked || planUsage?.planLocked === true;
  const canAddPerson = !planLocked && (planUsage?.canAddPerson ?? true);
  const canEditTree = canEdit && !planLocked;

  if (planLocked) {
    return (
      <main className="min-h-screen bg-gray-100">
        <Header
          backHref="/dashboard"
          backLabel="Dashboard"
          profile={profile}
        />

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-white p-10 shadow">
          <h1 className="text-3xl font-bold text-green-700">
            {family.name}
          </h1>
          <p className="mt-4 text-gray-700">
            Dieser Stammbaum ist durch den Free-Tarif gesperrt. Der Besitzer
            muss Premium aktivieren, damit der Baum wieder geöffnet werden
            kann.
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
                className="rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800"
              >
                Tarif verwalten
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <Header
        backHref="/dashboard"
        backLabel="Dashboard"
        profile={profile}
      />

      <div className="mx-auto mt-8 max-w-7xl px-6">

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-700">
            {family.name}
          </h1>

          {planUsage?.ownerPlanCode === "free" &&
            planUsage.maxPersons !== null && (
            <p className="mt-1 text-sm text-gray-500">
              {planUsage.personCount}/{planUsage.maxPersons} Personen
            </p>
          )}
        </div>

        {actionError === "person-limit" && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            {isOwner
              ? "Personenlimit erreicht. Weitere Personen sind mit Premium möglich."
              : "Das Personenlimit des Besitzers ist erreicht."}
          </div>
        )}

        <FamilyTree
          familyId={family.id}
          persons={persons ?? []}
          relationships={relationships ?? []}
          canEdit={canEditTree}
          canAddPerson={canAddPerson}
        />

      </div>
    </main>
  );
}