import { defaultLocale, type Locale } from "@/lib/i18n/config";

export type Messages = Record<string, unknown>;

const catalogs: Record<Locale, () => Promise<Messages>> = {
  de: () => import("../../messages/de.json").then((m) => m.default),
  en: () => import("../../messages/en.json").then((m) => m.default),
  ar: () => import("../../messages/ar.json").then((m) => m.default),
};

export async function getMessages(locale: Locale): Promise<Messages> {
  try {
    return await catalogs[locale]();
  } catch {
    return catalogs[defaultLocale]();
  }
}

export function translate(
  messages: Messages,
  key: string,
  values?: Record<string, string | number>
): string {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return key;
    }
    current = (current as Record<string, unknown>)[part];
  }

  if (typeof current !== "string") {
    return key;
  }

  if (!values) {
    return current;
  }

  return current.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = values[name];
    return value === undefined ? `{${name}}` : String(value);
  });
}
