export const PERSIST_COOKIE = "malbat_persist";
export const LAST_ACTIVE_COOKIE = "malbat_last_active";

/** Idle timeout when "Angemeldet bleiben" is not checked. */
export const IDLE_TIMEOUT_MS = 60 * 60 * 1000;

/** Long-lived cookie / auth persistence when remember is on (~13 months). */
export const PERSIST_MAX_AGE_SEC = 60 * 60 * 24 * 400;

export function isPersistEnabled(value: string | undefined | null): boolean {
  return value === "1";
}

export function isAuthMarketingPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return true;
  }
  return pathname.startsWith("/register/");
}
