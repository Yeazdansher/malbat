import Link from "next/link";

import AppIconEasterEgg from "@/components/AppIconEasterEgg";
import BrandMark from "@/components/BrandMark";
import UserMenu from "./UserMenu";
import { getTranslator } from "@/lib/i18n/server";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url: string | null;
} | null;

type HeaderProps = {
  title?: string;
  backHref?: string;
  backLabel?: string;
  profile?: Profile;
  /** Dunkler Glas-Header über Hero-Hintergründen */
  glass?: boolean;
};

export default async function Header({
  title = "MALBAT",
  backHref,
  backLabel,
  profile,
  glass = false,
}: HeaderProps) {
  const t = await getTranslator("common");
  const isBrandTitle = title === "MALBAT" || title === t("appName");
  const brandClass = glass
    ? "text-3xl text-[#d8f0e0]"
    : "text-3xl text-green-700";

  return (
    <header
      className={
        glass
          ? "relative z-50 overflow-visible border-b border-white/10 bg-[#0c1a12]/82 backdrop-blur-md"
          : "relative z-50 overflow-visible border-b border-[var(--border)] bg-[var(--header-bg)]"
      }
    >
      <div className="relative flex min-h-[4.75rem] items-center justify-between gap-3 overflow-visible px-6 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {backHref && backLabel && (
            <Link
              href={backHref}
              className={
                glass
                  ? "shrink-0 text-white/80 hover:text-white hover:underline"
                  : "shrink-0 text-green-700 hover:underline"
              }
            >
              ← {backLabel}
            </Link>
          )}

          {!isBrandTitle && (
            <h1
              className={
                glass
                  ? "truncate text-3xl font-bold text-[#d8f0e0]"
                  : "truncate text-3xl font-bold text-green-700"
              }
            >
              {title}
            </h1>
          )}
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <div className="pointer-events-auto">
            <BrandMark
              as={isBrandTitle ? "h1" : "div"}
              className={brandClass}
              icon={<AppIconEasterEgg size={44} />}
            />
          </div>
        </div>

        <div className="flex flex-1 justify-end">
          <UserMenu profile={profile} />
        </div>
      </div>
    </header>
  );
}
