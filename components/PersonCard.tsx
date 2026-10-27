"use client";

import { useTranslations } from "@/lib/i18n/client";

type PersonCardProps = {
  firstName: string;
  lastName: string;
  gender: "male" | "female" | "unknown";
  age: number;
  isDeceased: boolean;
  photoUrl?: string | null;

  onOpenDetails: () => void;
  onOpenRelationship: () => void;
  onOpenParents?: () => void;
  onOpenSiblings?: () => void;
  hasParents?: boolean;
  canEdit?: boolean;
};

export default function PersonCard({
  firstName,
  lastName,
  gender,
  age,
  isDeceased,
  photoUrl,
  onOpenDetails,
  onOpenRelationship,
  onOpenParents,
  onOpenSiblings,
  hasParents = false,
  canEdit = true,
}: PersonCardProps) {
  const t = useTranslations("tree");
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="relative w-[270px] rounded-md border border-gray-300 bg-white p-4 text-gray-900 shadow-sm dark:border-[var(--border)] dark:bg-[var(--card-bg)] dark:text-[var(--card-text)]">
      {canEdit && !hasParents && (
        <button
          type="button"
          className="nodrag nopan nowheel absolute z-20 left-1/2 top-0 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-300 bg-white text-base leading-none hover:bg-green-100 dark:border-[var(--border)] dark:bg-[var(--card-bg)] dark:hover:bg-[#1f7a45]/25"
          title={t("addParents")}
          aria-label={t("addParents")}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onOpenParents?.();
          }}
        >
          👨‍👩‍👧‍👦
        </button>
      )}

      {canEdit && (
        <>
          <button
            type="button"
            className="nodrag nopan nowheel absolute z-20 left-0 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-300 bg-white text-base leading-none hover:bg-green-100 dark:border-[var(--border)] dark:bg-[var(--card-bg)] dark:hover:bg-[#1f7a45]/25"
            title={t("addSiblings")}
            aria-label={t("addSiblings")}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onOpenSiblings?.();
            }}
          >
            👥
          </button>

          {gender !== "female" && (
            <button
              type="button"
              className="nodrag nopan nowheel absolute z-20 right-0 top-1/2 flex h-8 w-8 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-300 bg-white text-base leading-none hover:bg-green-100 dark:border-[var(--border)] dark:bg-[var(--card-bg)] dark:hover:bg-[#1f7a45]/25"
              title={t("addPartner")}
              aria-label={t("addPartner")}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onOpenRelationship();
              }}
            >
              👩‍❤️‍👨
            </button>
          )}
        </>
      )}

      <div className="flex gap-3">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            className="h-14 w-14 rounded object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded bg-green-700 text-lg font-bold text-white">
            {initials}
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={
                gender === "male"
                  ? "text-xl text-blue-600"
                  : gender === "female"
                    ? "text-xl text-pink-500"
                    : "text-xl text-gray-500"
              }
            >
              {gender === "male"
                ? "♂"
                : gender === "female"
                  ? "♀"
                  : "?"}
            </span>

            <h3 className="font-semibold leading-5 text-gray-900 dark:text-[var(--card-text)]">
              {firstName} {lastName}
            </h3>
          </div>

          <div className="mt-3 flex items-center gap-2 text-gray-600 dark:text-[var(--muted-text)]">
            <span className="text-lg">{isDeceased ? "✝" : "🎂"}</span>
            <span>{t("years", { count: age })}</span>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onOpenDetails();
          }}
          className="nodrag nopan nowheel w-full rounded border border-gray-300 py-2 text-sm text-gray-900 transition hover:bg-gray-100 dark:border-[var(--border)] dark:text-[var(--card-text)] dark:hover:bg-[#1f7a45]/20"
        >
          {t("furtherDetails")}
        </button>
      </div>
    </div>
  );
}
