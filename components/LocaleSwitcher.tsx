"use client";

import { useTransition } from "react";

import { setLocale } from "@/app/i18n/actions";
import { useI18n } from "@/lib/i18n/client";
import { locales, type Locale } from "@/lib/i18n/config";

type LocaleSwitcherProps = {
  className?: string;
  /** Kompakte Variante für Header */
  compact?: boolean;
};

export default function LocaleSwitcher({
  className = "",
  compact = false,
}: LocaleSwitcherProps) {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();

  return (
    <label
      className={`flex items-center gap-2 ${className}`}
      title={t("locale.label")}
    >
      {!compact && (
        <span className="text-sm font-medium text-current">
          {t("locale.label")}
        </span>
      )}
      <select
        className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-green-700 focus:outline-none disabled:opacity-60"
        value={locale}
        disabled={pending}
        aria-label={t("locale.label")}
        onChange={(event) => {
          const next = event.target.value as Locale;
          startTransition(() => {
            void setLocale(next);
          });
        }}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {t(`locale.${code}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
