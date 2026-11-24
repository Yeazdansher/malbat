import { redirect } from "next/navigation";

import Header from "@/components/Header";
import AddPhotosButton from "@/components/family/memories/AddPhotosButton";
import BackToTreeLink from "@/components/family/memories/BackToTreeLink";
import FamilyPhotoTimeline from "@/components/family/memories/FamilyPhotoTimeline";
import { canEditFamily } from "@/lib/family-permissions";
import type { FamilyRole } from "@/lib/invitations";
import { getLocale } from "@/lib/i18n/get-locale";
import { getTranslator } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PhotoRow = {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
  created_at: string;
};

export default async function FamilyPhotosPage({ params }: PageProps) {
  const { id: familyId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, t, tCommon, locale] = await Promise.all([
    getCurrentProfile(),
    getTranslator("memories"),
    getTranslator("common"),
    getLocale(),
  ]);

  const { data: family } = await supabase
    .from("families")
    .select("id, name")
    .eq("id", familyId)
    .single();

  const { data: membership } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!family || !membership) {
    return (
      <main className="surface-page min-h-screen">
        <Header
          backHref="/dashboard"
          backLabel={tCommon("dashboard")}
          profile={profile}
        />
        <div className="surface-card mx-auto mt-10 max-w-3xl rounded-2xl border p-10 shadow-sm">
          <h1 className="text-2xl font-bold text-red-600">{t("notFound")}</h1>
        </div>
      </main>
    );
  }

  const role = membership.role as FamilyRole;
  const canEdit = canEditFamily(role);

  const { data: photoRows, error: photosError } = await supabase
    .from("family_memory_photos")
    .select("id, url, caption, taken_at, created_at")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });

  if (photosError) {
    console.error("family photos load:", photosError);
  }

  const photos = ((photoRows as PhotoRow[] | null) ?? [])
    .slice()
    .sort((a, b) => {
      if (a.taken_at && b.taken_at) {
        return b.taken_at.localeCompare(a.taken_at);
      }
      if (a.taken_at) return -1;
      if (b.taken_at) return 1;
      return b.created_at.localeCompare(a.created_at);
    });

  return (
    <main className="surface-page min-h-screen">
      <Header
        backHref="/dashboard"
        backLabel={tCommon("dashboard")}
        profile={profile}
      />

      <div className="w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="text-sm text-[var(--muted-text)]">{family.name}</p>
              <h1 className="mt-1 text-3xl font-bold text-green-700 dark:text-[#8fd4a8]">
                {t("title")}
              </h1>
            </div>
            {canEdit && <AddPhotosButton familyId={familyId} />}
          </div>
          <BackToTreeLink familyId={familyId} label={t("backToTree")} />
        </div>

        {photosError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900">
            {t("loadError")}
          </div>
        )}

        {!photosError && (
          <FamilyPhotoTimeline
            familyId={familyId}
            photos={photos}
            canEdit={canEdit}
            locale={locale}
            emptyMessage={
              canEdit ? t("emptyPhotosEditor") : t("emptyPhotosViewer")
            }
          />
        )}
      </div>
    </main>
  );
}
