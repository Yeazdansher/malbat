"use client";

import { useState } from "react";

import { useI18n, useTranslations } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";

export type BirthdayPerson = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
};

type Props = {
  people: BirthdayPerson[];
  locked?: boolean;
};

function birthDayOfMonth(birthDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  return match ? Number(match[3]) : 0;
}

function formatBirthdayLabel(birthDate: string, locale: Locale): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  if (!match) {
    return birthDate;
  }

  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(2000, month - 1, day);
  const localeTag =
    locale === "ar" ? "ar" : locale === "ku" ? "ku" : locale === "en" ? "en-GB" : "de-DE";

  return date.toLocaleDateString(localeTag, {
    day: "numeric",
    month: "long",
  });
}

export default function BirthdaysThisMonthBadge({
  people,
  locked = false,
}: Props) {
  const t = useTranslations("dashboard");
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);

  const sorted = [...people].sort(
    (a, b) => birthDayOfMonth(a.birthDate) - birthDayOfMonth(b.birthDate)
  );
  const count = sorted.length;

  const badgeClass = locked
    ? "rounded-full bg-amber-600/12 px-3 py-1 text-sm font-medium text-amber-950 dark:bg-amber-400/15 dark:text-amber-100"
    : "rounded-full bg-[#1f7a45]/12 px-3 py-1 text-sm font-medium text-[#14532d] dark:bg-[#1f7a45]/25 dark:text-[#b7e6c8]";

  const label = t("birthdays", { count });

  if (count === 0) {
    return <span className={badgeClass}>{label}</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${badgeClass} cursor-pointer transition hover:bg-[#1f7a45]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f7a45]`}
        aria-haspopup="dialog"
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="birthdays-this-month-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="birthdays-this-month-title"
                className="text-2xl font-bold text-green-700"
              >
                {t("birthdaysTitle")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-800"
                aria-label={t("birthdaysClose")}
              >
                ×
              </button>
            </div>

            <ul className="mt-6 max-h-[60vh] space-y-3 overflow-y-auto">
              {sorted.map((person) => (
                <li
                  key={person.id}
                  className="flex items-baseline justify-between gap-4 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3"
                >
                  <span className="font-semibold text-gray-900">
                    {person.firstName} {person.lastName}
                  </span>
                  <span className="shrink-0 text-sm text-amber-900">
                    {formatBirthdayLabel(person.birthDate, locale)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border px-5 py-3 hover:bg-gray-100"
              >
                {t("birthdaysClose")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
