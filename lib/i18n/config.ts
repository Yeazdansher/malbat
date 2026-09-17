export const locales = ["de", "en", "ar", "ku"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "de";

export const LOCALE_COOKIE = "malbat_locale";

export const localeLabels: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  ar: "العربية",
  ku: "Kurmancî",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}

export function dirForLocale(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
