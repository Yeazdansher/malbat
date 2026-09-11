import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/components/Header";
import FamilyActionsMenu from "@/components/dashboard/FamilyActionsMenu";
import DeleteFamilyButton from "@/components/family/DeleteFamilyButton";
import { roleLabel } from "@/lib/invitations";
import { getCurrentPlanUsage } from "@/lib/plans";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    familyDeleted?: string;
  }>;
};

type DashboardFamilyItem = {
  role: "owner" | "editor" | "viewer";
  families: {
    id: string;
    name: string;
    description: string | null;
    plan_locked: boolean;
  };
};

type FamilyStats = {
  personCount: number;
  birthdaysThisMonth: number;
};

function birthMonthFromDate(birthDate: string | null): number | null {
  if (!birthDate) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  if (!match) {
    return null;
  }

  return Number(match[2]);
}

export default async function DashboardPage({
  searchParams,
}: PageProps) {
  const { familyDeleted } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, planUsage] = await Promise.all([
    getCurrentProfile(),
    getCurrentPlanUsage(),
  ]);

  const { data: families, error } = await supabase
    .from("family_members")
    .select(`
      role,
      families (
        id,
        name,
        description,
        plan_locked
      )
    `)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
  }

  const familyItems = (families ?? []).filter(
    (item) => item.families
  ) as unknown as DashboardFamilyItem[];
  const familyIds = familyItems.map((item) => item.families.id);
  const currentMonth = new Date().getMonth() + 1;
  const statsByFamily = new Map<string, FamilyStats>();

  for (const familyId of familyIds) {
    statsByFamily.set(familyId, {
      personCount: 0,
      birthdaysThisMonth: 0,
    });
  }

  if (familyIds.length > 0) {
    const { data: persons, error: personsError } = await supabase
      .from("persons")
      .select("family_id, birth_date, is_deceased")
      .in("family_id", familyIds);

    if (personsError) {
      console.error(personsError);
    }

    for (const person of persons ?? []) {
      const stats = statsByFamily.get(person.family_id);
      if (!stats) {
        continue;
      }

      stats.personCount += 1;

      if (
        !person.is_deceased &&
        birthMonthFromDate(person.birth_date) === currentMonth
      ) {
        stats.birthdaysThisMonth += 1;
      }
    }
  }

  const ownedFamilyLimitReached =
    planUsage?.planCode === "free" &&
    planUsage.maxOwnedFamilies !== null &&
    planUsage.ownedFamiliesCount >= planUsage.maxOwnedFamilies;

  return (
    <main className="min-h-screen bg-gray-100">
      <Header profile={profile} />

      <div className="mx-auto max-w-5xl p-8">
        {familyDeleted === "1" && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            Der Stammbaum wurde vollständig gelöscht.
          </div>
        )}

        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">
            Meine Stammbäume
          </h2>

          <Link
            href={
              ownedFamilyLimitReached
                ? "/profile#plan"
                : "/family/new"
            }
            className="rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800"
          >
            {ownedFamilyLimitReached
              ? "Premium für weiteren Stammbaum"
              : "+ Neuer Stammbaum"}
          </Link>
        </div>

        {familyItems.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <p className="text-lg text-gray-600">
              Du hast noch keinen Stammbaum erstellt.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {familyItems.map((item) => {
              const stats = statsByFamily.get(item.families.id) ?? {
                personCount: 0,
                birthdaysThisMonth: 0,
              };

              return (
                <div
                  key={item.families.id}
                  className="rounded-2xl border bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold">
                        {item.families.name}
                      </h3>

                      {item.families.description && (
                        <p className="mt-2 text-gray-600">
                          {item.families.description}
                        </p>
                      )}

                      <p className="mt-3 text-sm text-gray-500">
                        Rolle: <strong>{roleLabel(item.role)}</strong>
                      </p>

                      <div className="mt-3 space-y-1 text-sm text-gray-700">
                        <p>
                          Personen: <strong>{stats.personCount}</strong>
                        </p>
                        <p>
                          Geburtstage diesen Monat:{" "}
                          <strong>{stats.birthdaysThisMonth}</strong>
                        </p>
                      </div>

                      {item.families.plan_locked && (
                        <p className="mt-2 text-sm font-medium text-amber-800">
                          Gesperrt durch Free-Tarif. Premium aktivieren, um
                          diesen Stammbaum wieder zu öffnen.
                        </p>
                      )}
                    </div>

                    {item.role === "owner" && !item.families.plan_locked && (
                      <FamilyActionsMenu
                        familyId={item.families.id}
                        familyName={item.families.name}
                        familyDescription={item.families.description}
                      />
                    )}
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {item.families.plan_locked ? (
                      <>
                        <Link
                          href="/profile#plan"
                          className="inline-block rounded-lg border border-amber-300 bg-amber-50 px-5 py-3 text-amber-900 hover:bg-amber-100"
                        >
                          Tarif verwalten
                        </Link>
                        {item.role === "owner" && (
                          <DeleteFamilyButton familyId={item.families.id} />
                        )}
                      </>
                    ) : (
                      <Link
                        href={`/family/${item.families.id}`}
                        className="inline-block rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800"
                      >
                        Stammbaum öffnen
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
