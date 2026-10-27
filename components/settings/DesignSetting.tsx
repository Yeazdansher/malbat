"use client";

import { useState, useTransition } from "react";

import { updateTheme } from "@/app/settings/actions";
import { useTranslations } from "@/lib/i18n/client";
import { isTheme, type Theme } from "@/lib/theme/config";

type Props = {
  initialTheme: Theme;
};

export default function DesignSetting({ initialTheme }: Props) {
  const t = useTranslations("settings");
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    if (!isTheme(value)) {
      return;
    }

    const previous = theme;
    setTheme(value);
    setMessage("");
    document.documentElement.setAttribute("data-theme", value);

    startTransition(async () => {
      const result = await updateTheme(value);
      if (!result.ok) {
        setTheme(previous);
        document.documentElement.setAttribute("data-theme", previous);
        setMessage(result.error);
        return;
      }
      setMessage(t("designSaved"));
    });
  }

  return (
    <div className="border-b border-[var(--border)] pb-4">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="design-setting" className="font-medium">
          {t("design")}
        </label>
        <select
          id="design-setting"
          className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-[var(--card-text)] focus:border-green-700 focus:outline-none disabled:opacity-60"
          value={theme}
          disabled={pending}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="light">{t("designLight")}</option>
          <option value="dark">{t("designDark")}</option>
        </select>
      </div>
      {message && (
        <p
          className={`mt-2 text-sm ${
            message === t("designSaved") ? "text-green-700" : "text-red-600"
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
