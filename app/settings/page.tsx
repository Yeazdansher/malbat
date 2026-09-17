import { redirect } from "next/navigation";

import Header from "@/components/Header";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { getTranslator } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { APP_VERSION } from "@/lib/version";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  const t = await getTranslator("settings");
  const tCommon = await getTranslator("common");

  return (
    <main className="min-h-screen bg-gray-100">
      <Header
        backHref="/dashboard"
        backLabel={tCommon("dashboard")}
        profile={profile}
      />

      <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-green-700">{t("title")}</h1>

        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between gap-4 border-b pb-4">
            <span className="font-medium">{t("language")}</span>
            <LocaleSwitcher />
          </div>

          <div className="flex items-center justify-between border-b pb-4">
            <label className="font-medium">{t("design")}</label>
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-700 focus:outline-none"
              defaultValue="light"
            >
              <option value="light">{t("designLight")}</option>
            </select>
          </div>

          <div className="flex items-center justify-between border-b pb-4">
            <label className="font-medium">{t("notifications")}</label>
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-700 focus:outline-none"
              defaultValue="enabled"
            >
              <option value="enabled">{t("notificationsOn")}</option>
            </select>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-between border-b pb-4 text-start transition hover:text-green-700"
          >
            <span className="font-medium">{t("privacy")}</span>
            <span className="text-gray-400">&gt;</span>
          </button>

          <div className="flex items-center justify-between border-b pb-4">
            <span className="font-medium">Version</span>
            <span className="text-gray-500">v{APP_VERSION}</span>
          </div>

          <div className="pt-4 text-center text-sm text-gray-400">
            © 2026{" "}
            <span
              className="font-semibold tracking-[0.06em]"
              style={{ fontFamily: "var(--font-malbat), serif" }}
            >
              MALBAT
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
