import Link from "next/link";
import { redirect } from "next/navigation";

import AppBackdrop from "@/components/AppBackdrop";
import Header from "@/components/Header";
import PageEntrance from "@/components/PageEntrance";
import FamilyActionsMenu from "@/components/dashboard/FamilyActionsMenu";
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

  const activeCardClass =
    "from-[#e8f6ee] via-white to-[#fff8ef] border-[#9fd4b3]/70";
  const lockedCardClass =
    "from-[#fff4e8] via-white to-[#eef7f1] border-[#f0c9a0]/70";

  return (
    <AppBackdrop>
      <PageEntrance eyebrow="Übersicht" title="Meine Stammbäume">
        <main className="min-h-screen">
          <Header profile={profile} glass />

          <div className="mx-auto max-w-5xl p-8">
            {familyDeleted === "1" && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50/95 px-4 py-3 text-green-800 shadow-sm">
                Der Stammbaum wurde vollständig gelöscht.
              </div>
            )}

            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <h2
                className="text-3xl font-semibold text-white"
                style={{ fontFamily: "var(--font-malbat), serif" }}
              >
                Meine Stammbäume
              </h2>

              <Link
                href={
                  ownedFamilyLimitReached
                    ? "/profile#plan"
                    : "/family/new"
                }
                className="rounded-lg bg-[#1f7a45] px-5 py-3 font-semibold text-white hover:bg-[#19653a]"
              >
                {ownedFamilyLimitReached
                  ? "Premium für weiteren Stammbaum"
                  : "+ Neuer Stammbaum"}
              </Link>
            </div>

            {familyItems.length === 0 ? (
              <div className="rounded-2xl border border-[#9fd4b3]/60 bg-gradient-to-br from-[#e8f6ee] via-white to-[#fff8ef] p-10 text-center shadow-lg backdrop-blur-sm">
                <p className="text-lg text-gray-700">
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
                  const locked = item.families.plan_locked;
                  const tint = locked ? lockedCardClass : activeCardClass;

                  return (
                    <div
                      key={item.families.id}
                      className={`rounded-2xl border bg-gradient-to-br p-6 shadow-lg backdrop-blur-sm ${tint}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3
                            className={
                              locked
                                ? "text-2xl font-semibold text-amber-950"
                                : "text-2xl font-semibold text-[#14532d]"
                            }
                            style={{
                              fontFamily: "var(--font-malbat), serif",
                            }}
                          >
                            {item.families.name}
                          </h3>

                          {item.families.description && (
                            <p className="mt-2 text-gray-700">
                              {item.families.description}
                            </p>
                          )}

                          <p className="mt-3 text-sm text-gray-600">
                            Rolle:{" "}
                            <strong
                              className={
                                locked ? "text-amber-800" : "text-[#1f7a45]"
                              }
                            >
                              {roleLabel(item.role)}
                            </strong>
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span
                              className={
                                locked
                                  ? "rounded-full bg-amber-600/12 px-3 py-1 text-sm font-medium text-amber-950"
                                  : "rounded-full bg-[#1f7a45]/12 px-3 py-1 text-sm font-medium text-[#14532d]"
                              }
                            >
                              {stats.personCount} Personen
                            </span>
                            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-900">
                              {stats.birthdaysThisMonth} Geburtstage diesen
                              Monat
                            </span>
                          </div>

                          {locked && (
                            <p className="mt-3 text-sm font-medium text-amber-800">
                              Gesperrt durch Free-Tarif. Premium aktivieren,
                              um diesen Stammbaum wieder zu öffnen.
                            </p>
                          )}
                        </div>

                        <FamilyActionsMenu
                          familyId={item.families.id}
                          familyName={item.families.name}
                          familyDescription={item.families.description}
                          role={item.role}
                        />
                      </div>

                      <div className="mt-8 flex flex-wrap gap-3">
                        {locked ? (
                          <Link
                            href="/profile#plan"
                            className="inline-block rounded-lg border border-amber-300 bg-amber-50 px-5 py-3 text-amber-900 hover:bg-amber-100"
                          >
                            Tarif verwalten
                          </Link>
                        ) : (
                          <Link
                            href={`/family/${item.families.id}`}
                            className="inline-block rounded-lg bg-[#1f7a45] px-5 py-3 font-semibold text-white hover:bg-[#19653a]"
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
      </PageEntrance>
    </AppBackdrop>
  );
}
