import { cookies } from "next/headers";

import {
  defaultTheme,
  isTheme,
  THEME_COOKIE,
  type Theme,
} from "@/lib/theme/config";

export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : defaultTheme;
}
