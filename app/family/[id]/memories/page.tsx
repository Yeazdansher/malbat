import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/components/Header";
import CreateAlbumForm from "@/components/family/memories/CreateAlbumForm";
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

type AlbumRow = {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  created_at: string;
};

type CoverRow = {
  album_id: string;
  url: string;
  sort_order: number;
  created_at: string;
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

export default async function FamilyMemoriesPage({ params }: PageProps) {
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

  const { data: albums, error: albumsError } = await supabase
    .from("family_memory_albums")
    .select("id, title, description, event_date, created_at")
    .eq("family_id", familyId)
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const albumIds = (albums ?? []).map((album) => album.id);
  let covers: CoverRow[] = [];

  if (albumIds.length > 0) {
    const { data: photoRows } = await supabase
      .from("family_memory_photos")
      .select("album_id, url, sort_order, created_at")
      .in("album_id", albumIds)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    covers = (photoRows as CoverRow[] | null) ?? [];
  }

  const coverByAlbum = new Map<string, string>();
  for (const photo of covers) {
    if (!coverByAlbum.has(photo.album_id)) {
      coverByAlbum.set(photo.album_id, photo.url);
    }
  }

  return (
    <main className="surface-page min-h-screen">
      <Header
        backHref={`/family/${familyId}`}
        backLabel={t("backToTree")}
        profile={profile}
      />

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--muted-text)]">{family.name}</p>
            <h1 className="mt-1 text-3xl font-bold text-green-700 dark:text-[#8fd4a8]">
              {t("title")}
            </h1>
            <p className="mt-2 max-w-xl text-[var(--muted-text)]">
              {t("subtitle")}
            </p>
          </div>
          {canEdit && <CreateAlbumForm familyId={familyId} />}
        </div>

        {albumsError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900">
            {t("loadError")}
          </div>
        )}

        {(albums as AlbumRow[] | null)?.length ? (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(albums as AlbumRow[]).map((album) => {
              const cover = coverByAlbum.get(album.id);
              const eventLabel = formatEventDate(album.event_date, locale);

              return (
                <li key={album.id}>
                  <Link
                    href={`/family/${familyId}/memories/${album.id}`}
                    className="surface-card group block overflow-hidden rounded-2xl border shadow-sm transition hover:border-green-700/40"
                  >
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt=""
                        className="aspect-[4/3] w-full object-cover transition group-hover:brightness-95"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] w-full items-center justify-center bg-[var(--page-bg)] text-sm text-[var(--muted-text)]">
                        {t("coverPlaceholder")}
                      </div>
                    )}
                    <div className="p-4">
                      <h2 className="truncate text-lg font-semibold text-[var(--card-text)]">
                        {album.title}
                      </h2>
                      {eventLabel && (
                        <p className="mt-1 text-sm text-[var(--muted-text)]">
                          {eventLabel}
                        </p>
                      )}
                      {album.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-text)]">
                          {album.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          !albumsError && (
            <div className="mt-10 rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
              <p className="text-lg font-medium text-[var(--card-text)]">
                {t("emptyAlbumsTitle")}
              </p>
              <p className="mt-2 text-[var(--muted-text)]">
                {canEdit ? t("emptyAlbumsEditor") : t("emptyAlbumsViewer")}
              </p>
            </div>
          )
        )}
      </div>
    </main>
  );
}
