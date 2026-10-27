export const themes = ["light", "dark"] as const;

export type Theme = (typeof themes)[number];

export const defaultTheme: Theme = "light";

export const THEME_COOKIE = "malbat_theme";

export function isTheme(value: string | undefined | null): value is Theme {
  return themes.includes(value as Theme);
}
