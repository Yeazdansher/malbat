import Link from "next/link";
import type { ReactNode } from "react";

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
  /** Optional mittig im Header (z. B. Dashboard-Icon) */
  center?: ReactNode;
};

export default async function Header({
  title = "MALBAT",
  backHref,
  backLabel,
  profile,
  glass = false,
  center,
}: HeaderProps) {
  const t = await getTranslator("common");
  const isBrandTitle = title === "MALBAT" || title === t("appName");

  return (
    <header
      className={
        glass
          ? "relative z-50 border-b border-white/10 bg-[#0c1a12]/82 backdrop-blur-md"
          : "relative z-50 border-b border-[var(--border)] bg-[var(--header-bg)]"
      }
    >
      <div className="relative flex items-center justify-between gap-3 px-6 py-3">
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

          {isBrandTitle ? (
            <BrandMark
              as="h1"
              className={
                glass
                  ? "text-3xl text-[#d8f0e0]"
                  : "text-3xl text-green-700"
              }
            />
          ) : (
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

        {center && (
          <div className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center">
            <div className="pointer-events-auto">{center}</div>
          </div>
        )}

        <div className="flex flex-1 justify-end">
          <UserMenu profile={profile} />
        </div>
      </div>
    </header>
  );
}
