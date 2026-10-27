import Link from "next/link";
import { redirect } from "next/navigation";

import AppBackdrop from "@/components/AppBackdrop";
import Header from "@/components/Header";
import BirthdaysThisMonthBadge, {
  type BirthdayPerson,
} from "@/components/dashboard/BirthdaysThisMonthBadge";
import DashboardCardsReveal from "@/components/dashboard/DashboardCardsReveal";
import FamilyActionsMenu from "@/components/dashboard/FamilyActionsMenu";
import { getTranslator } from "@/lib/i18n/server";
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
  birthdayPeople: BirthdayPerson[];
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
      birthdayPeople: [],
    });
  }

  if (familyIds.length > 0) {
    const { data: persons, error: personsError } = await supabase
      .from("persons")
      .select("id, family_id, first_name, last_name, birth_date, is_deceased")
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
        person.birth_date &&
        birthMonthFromDate(person.birth_date) === currentMonth
      ) {
        stats.birthdayPeople.push({
          id: person.id,
          firstName: person.first_name,
          lastName: person.last_name,
          birthDate: person.birth_date,
        });
      }
    }
  }

  const ownedFamilyLimitReached =
    planUsage?.planCode === "free" &&
    planUsage.maxOwnedFamilies !== null &&
    planUsage.ownedFamiliesCount >= planUsage.maxOwnedFamilies;

  const activeCardClass =
    "from-[#e8f6ee] via-white to-[#fff8ef] border-[#9fd4b3]/70 dark:from-[#15241c] dark:via-[#1a2a22] dark:to-[#1f2a20] dark:border-[#3d6b52]/70";
  const lockedCardClass =
    "from-[#fff4e8] via-white to-[#eef7f1] border-[#f0c9a0]/70 dark:from-[#2a2218] dark:via-[#1f241c] dark:to-[#1a2420] dark:border-[#8a6a45]/70";

  const t = await getTranslator("dashboard");

  return (
    <AppBackdrop>
      <main className="min-h-screen">
        <Header profile={profile} glass />

        <div className="mx-auto max-w-5xl p-8">
          {familyDeleted === "1" && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50/95 px-4 py-3 text-green-800 shadow-sm">
              {t("deleted")}
            </div>
          )}

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h2
              className="text-3xl font-semibold text-white"
              style={{ fontFamily: "var(--font-malbat), serif" }}
            >
              {t("title")}
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
                ? t("premiumForMore")
                : t("newTree")}
            </Link>
          </div>

          {familyItems.length === 0 ? (
            <DashboardCardsReveal>
              {[
                <div
                  key="empty"
                  className="rounded-2xl border border-[#9fd4b3]/60 bg-gradient-to-br from-[#e8f6ee] via-white to-[#fff8ef] p-10 text-center shadow-lg backdrop-blur-sm dark:border-[#3d6b52]/70 dark:from-[#15241c] dark:via-[#1a2a22] dark:to-[#1f2a20]"
                >
                  <p className="text-lg text-gray-700 dark:text-gray-200">
                    {t("empty")}
                  </p>
                </div>,
              ]}
            </DashboardCardsReveal>
          ) : (
            <DashboardCardsReveal>
              {familyItems.map((item) => {
                const stats = statsByFamily.get(item.families.id) ?? {
                  personCount: 0,
                  birthdayPeople: [],
                };
                const locked = item.families.plan_locked;
                const tint = locked ? lockedCardClass : activeCardClass;

                return (
                  <div
                    key={item.families.id}
                    data-family-card
                    className={`relative rounded-2xl border bg-gradient-to-br p-6 shadow-lg backdrop-blur-sm ${tint}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3
                          className={
                            locked
                              ? "text-2xl font-semibold text-amber-950 dark:text-amber-100"
                              : "text-2xl font-semibold text-[#14532d] dark:text-[#b7e6c8]"
                          }
                          style={{
                            fontFamily: "var(--font-malbat), serif",
                          }}
                        >
                          {item.families.name}
                        </h3>

                        {item.families.description && (
                          <p className="mt-2 text-gray-700 dark:text-gray-300">
                            {item.families.description}
                          </p>
                        )}

                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                          {t("role")}:{" "}
                          <strong
                            className={
                              locked
                                ? "text-amber-800 dark:text-amber-200"
                                : "text-[#1f7a45] dark:text-[#8fd4a8]"
                            }
                          >
                            {t(`roles.${item.role}`)}
                          </strong>
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span
                            className={
                              locked
                                ? "rounded-full bg-amber-600/12 px-3 py-1 text-sm font-medium text-amber-950 dark:bg-amber-400/15 dark:text-amber-100"
                                : "rounded-full bg-[#1f7a45]/12 px-3 py-1 text-sm font-medium text-[#14532d] dark:bg-[#1f7a45]/25 dark:text-[#b7e6c8]"
                            }
                          >
                            {t("persons", { count: stats.personCount })}
                          </span>
                          <BirthdaysThisMonthBadge
                            people={stats.birthdayPeople}
                            locked={locked}
                          />
                        </div>

                        {locked && (
                          <p className="mt-3 text-sm font-medium text-amber-800">
                            {t("lockedHint")}
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
                          {t("managePlan")}
                        </Link>
                      ) : (
                        <Link
                          href={`/family/${item.families.id}`}
                          className="inline-block rounded-lg bg-[#1f7a45] px-5 py-3 font-semibold text-white hover:bg-[#19653a]"
                        >
                          {t("openTree")}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </DashboardCardsReveal>
          )}
        </div>
      </main>
    </AppBackdrop>
  );
}
