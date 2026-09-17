"use client";

import { formatDate } from "@/lib/dates";
import { useTranslations } from "@/lib/i18n/client";

type PersonDetailsDialogProps = {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;

  firstName: string;
  lastName: string;
  gender: "male" | "female" | "unknown";
  age: number | null;
  birthDate: string | null;
  birthPlace: string | null;
  isDeceased: boolean;
  deathDate: string | null;
  deathPlace: string | null;
  notes: string | null;
  photoUrl?: string | null;
  fatherName: string | null;
  motherName: string | null;
  partnerNames: string[];
  childNames: string[];
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <p className="text-[15px] leading-7 text-gray-900">
      <span className="font-semibold">{label}</span>
      <span className="ms-3 font-normal">{value}</span>
    </p>
  );
}

export default function PersonDetailsDialog({
  open,
  onClose,
  onEdit,
  onDelete,
  canEdit,
  firstName,
  lastName,
  gender,
  age,
  birthDate,
  birthPlace,
  isDeceased,
  deathDate,
  deathPlace,
  notes,
  photoUrl,
  fatherName,
  motherName,
  partnerNames,
  childNames,
}: PersonDetailsDialogProps) {
  const t = useTranslations("person");

  if (!open) return null;

  const genderLabel =
    gender === "male"
      ? t("genderMale")
      : gender === "female"
        ? t("genderFemale")
        : t("genderUnknown");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl sm:p-10">
        <div className="flex items-center gap-5">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="h-20 w-20 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-green-700 text-2xl font-bold text-white">
              {`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()}
            </div>
          )}

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              {firstName} {lastName}
            </h2>
            <p className="mt-1 text-gray-500">{genderLabel}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-0">
          <div className="space-y-1 md:pe-8">
            <DetailRow
              label={t("age")}
              value={age === null ? "-" : t("years", { count: age })}
            />
            <DetailRow label={t("birthDate")} value={formatDate(birthDate)} />
            <DetailRow label={t("birthPlace")} value={birthPlace || "-"} />

            {isDeceased && (
              <>
                <DetailRow
                  label={t("deathDate")}
                  value={formatDate(deathDate)}
                />
                <DetailRow label={t("deathPlace")} value={deathPlace || "-"} />
              </>
            )}
          </div>

          <div className="space-y-1 border-t border-gray-200 pt-6 md:border-s md:border-t-0 md:ps-8 md:pt-0">
            <DetailRow label={t("father")} value={fatherName || "-"} />
            <DetailRow label={t("mother")} value={motherName || "-"} />

            {partnerNames.length > 0 && (
              <DetailRow
                label={t("partner")}
                value={partnerNames.join(", ")}
              />
            )}

            {childNames.length > 0 && (
              <DetailRow
                label={
                  childNames.length === 1 ? t("child") : t("children")
                }
                value={childNames.join(", ")}
              />
            )}
          </div>
        </div>

        <div className="mt-8">
          <p className="font-semibold text-gray-900">{t("notes")}</p>
          <div className="mt-2 min-h-28 whitespace-pre-wrap rounded-md border border-gray-800 bg-white p-4 text-gray-800">
            {notes?.trim() ? notes : "-"}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          {canEdit ? (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg bg-red-600 px-5 py-3 text-white transition hover:bg-red-700"
            >
              {t("deletePerson")}
            </button>
          ) : (
            <span />
          )}

          <div className="flex gap-3">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setTimeout(() => onEdit(), 0);
                }}
                className="rounded-lg bg-green-700 px-5 py-3 text-white transition hover:bg-green-800"
              >
                {t("edit")}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-800 px-5 py-3 text-gray-900 transition hover:bg-gray-100"
            >
              {t("close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
