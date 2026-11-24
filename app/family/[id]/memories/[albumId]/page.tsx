import { redirect } from "next/navigation";

import Header from "@/components/Header";
import AlbumActions from "@/components/family/memories/AlbumActions";
import MemoryPhotoGrid from "@/components/family/memories/MemoryPhotoGrid";
import { canEditFamily } from "@/lib/family-permissions";
import type { FamilyRole } from "@/lib/invitations";
import { getLocale } from "@/lib/i18n/get-locale";
import { getTranslator } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
    albumId: string;
  }>;
};

function formatEventDate(value: string | null, locale: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default async function FamilyMemoryAlbumPage({ params }: PageProps) {
  const { id: familyId, albumId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, t, locale] = await Promise.all([
    getCurrentProfile(),
    getTranslator("memories"),
    getLocale(),
  ]);

  const { data: membership } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: album } = await supabase
    .from("family_memory_albums")
    .select("id, title, description, event_date, family_id")
    .eq("id", albumId)
    .eq("family_id", familyId)
    .maybeSingle();

  if (!membership || !album) {
    return (
      <main className="surface-page min-h-screen">
        <Header
          backHref={`/family/${familyId}/memories`}
          backLabel={t("backToAlbums")}
          profile={profile}
        />
        <div className="surface-card mx-auto mt-10 max-w-3xl rounded-2xl border p-10 shadow-sm">
          <h1 className="text-2xl font-bold text-red-600">{t("albumNotFound")}</h1>
        </div>
      </main>
    );
  }

  const role = membership.role as FamilyRole;
  const canEdit = canEditFamily(role);

  const { data: photos, error: photosError } = await supabase
    .from("family_memory_photos")
    .select("id, url, caption, sort_order")
    .eq("album_id", albumId)
    .eq("family_id", familyId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const eventLabel = formatEventDate(album.event_date, locale);

  return (
    <main className="surface-page min-h-screen">
      <Header
        backHref={`/family/${familyId}/memories`}
        backLabel={t("backToAlbums")}
        profile={profile}
      />

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-green-700 dark:text-[#8fd4a8]">
              {album.title}
            </h1>
            {eventLabel && (
              <p className="mt-2 text-[var(--muted-text)]">{eventLabel}</p>
            )}
            {album.description && (
              <p className="mt-3 max-w-2xl text-[var(--card-text)]">
                {album.description}
              </p>
            )}
            {canEdit && (
              <AlbumActions
                familyId={familyId}
                albumId={albumId}
                title={album.title}
                description={album.description}
                eventDate={album.event_date}
              />
            )}
          </div>
        </div>

        {photosError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900">
            {t("loadError")}
          </div>
        )}

        <MemoryPhotoGrid
          familyId={familyId}
          albumId={albumId}
          photos={photos ?? []}
          canEdit={canEdit}
        />
      </div>
    </main>
  );
}
