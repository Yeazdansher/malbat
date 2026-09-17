import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/components/Header";
import { getTranslator } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

import { createFamily } from "./actions";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewFamilyPage({
  searchParams,
}: PageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  const t = await getTranslator("familyNew");
  const tCommon = await getTranslator("common");
  const tDashboard = await getTranslator("dashboard");

  return (
    <main className="min-h-screen bg-gray-100">
      <Header
        backHref="/dashboard"
        backLabel={tCommon("dashboard")}
        profile={profile}
      />

      <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-green-700">{t("title")}</h1>

        {error === "plan-limit" && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            {tDashboard("premiumForMore")}{" "}
            <Link
              href="/profile#plan"
              className="ms-1 font-semibold underline"
            >
              {tDashboard("managePlan")}
            </Link>
          </div>
        )}

        <form action={createFamily} className="mt-8 space-y-6">
          <div>
            <label className="mb-2 block font-medium">
              {t("name")} <span className="text-red-600">*</span>
            </label>

            <input
              name="name"
              type="text"
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-green-700 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              {t("description")}
            </label>

            <textarea
              name="description"
              rows={4}
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-green-700 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg border border-gray-300 px-5 py-3 hover:bg-gray-100"
            >
              {tCommon("cancel")}
            </Link>

            <button
              type="submit"
              className="rounded-lg bg-green-700 px-6 py-3 font-medium text-white hover:bg-green-800"
            >
              {t("submit")}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
