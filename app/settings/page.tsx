import { redirect } from "next/navigation";

import Header from "@/components/Header";
import DesignSetting from "@/components/settings/DesignSetting";
import NotificationsSetting from "@/components/settings/NotificationsSetting";
import { COMPANY_NAME, COMPANY_URL } from "@/lib/company";
import { getTranslator } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { defaultTheme, isTheme, type Theme } from "@/lib/theme/config";
import { getTheme } from "@/lib/theme/get-theme";
import { APP_VERSION } from "@/lib/version";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, cookieTheme] = await Promise.all([
    getCurrentProfile(),
    getTheme(),
  ]);
  const t = await getTranslator("settings");
  const tCommon = await getTranslator("common");

  const notificationsEnabled =
    profile &&
    typeof profile === "object" &&
    "notifications_enabled" in profile
      ? Boolean(
          (profile as { notifications_enabled?: boolean | null })
            .notifications_enabled ?? true
        )
      : true;

  const profileTheme =
    profile &&
    typeof profile === "object" &&
    "theme" in profile &&
    isTheme((profile as { theme?: string | null }).theme ?? null)
      ? ((profile as { theme: Theme }).theme as Theme)
      : null;
  const initialTheme = profileTheme ?? cookieTheme ?? defaultTheme;

  const aboutBody = t("aboutBody", { company: COMPANY_NAME });
  const companyIndex = aboutBody.indexOf(COMPANY_NAME);

  return (
    <main className="surface-page min-h-screen">
      <Header
        backHref="/dashboard"
        backLabel={tCommon("dashboard")}
        profile={profile}
      />

      <div className="surface-card mx-auto mt-10 max-w-2xl rounded-2xl border p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-green-700 dark:text-[#8fd4a8]">
          {t("title")}
        </h1>

        <div className="mt-8 space-y-6">
          <DesignSetting initialTheme={initialTheme} />

          <NotificationsSetting initialEnabled={notificationsEnabled} />

          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <span className="font-medium">{t("version")}</span>
            <span className="text-[var(--muted-text)]">v{APP_VERSION}</span>
          </div>

          <div className="border-b border-[var(--border)] pb-4">
            <p className="font-medium">{t("about")}</p>
            <p className="mt-2 text-sm text-[var(--muted-text)]">
              {COMPANY_URL && companyIndex >= 0 ? (
                <>
                  {aboutBody.slice(0, companyIndex)}
                  <a
                    href={COMPANY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-green-700 underline-offset-2 hover:underline dark:text-[#8fd4a8]"
                  >
                    {COMPANY_NAME}
                  </a>
                  {aboutBody.slice(companyIndex + COMPANY_NAME.length)}
                </>
              ) : (
                aboutBody
              )}
            </p>
          </div>

          <div className="pt-4 text-center text-sm text-[var(--muted-text)]">
            {t("footerCredit", { company: COMPANY_NAME })}
          </div>
        </div>
      </div>
    </main>
  );
}
