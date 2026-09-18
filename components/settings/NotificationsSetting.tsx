"use client";

import { useState, useTransition } from "react";

import { updateNotificationsEnabled } from "@/app/settings/actions";
import { useTranslations } from "@/lib/i18n/client";

type Props = {
  initialEnabled: boolean;
};

export default function NotificationsSetting({ initialEnabled }: Props) {
  const t = useTranslations("settings");
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    const next = value === "enabled";
    setEnabled(next);
    setMessage("");

    startTransition(async () => {
      const result = await updateNotificationsEnabled(next);
      if (!result.ok) {
        setEnabled(!next);
        setMessage(result.error);
        return;
      }
      setMessage(t("notificationsSaved"));
    });
  }

  return (
    <div className="border-b pb-4">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="notifications-setting" className="font-medium">
          {t("notifications")}
        </label>
        <select
          id="notifications-setting"
          className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-700 focus:outline-none disabled:opacity-60"
          value={enabled ? "enabled" : "disabled"}
          disabled={pending}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="enabled">{t("notificationsOn")}</option>
          <option value="disabled">{t("notificationsOff")}</option>
        </select>
      </div>
      {message && (
        <p
          className={`mt-2 text-sm ${
            message === t("notificationsSaved")
              ? "text-green-700"
              : "text-red-600"
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
