import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import UserMenu from "./UserMenu";

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

export default function Header({
  title = "MALBAT",
  backHref,
  backLabel,
  profile,
  glass = false,
}: HeaderProps) {
  const isBrandTitle = title === "MALBAT";

  return (
    <header
      className={
        glass
          ? "border-b border-white/10 bg-[#0c1a12]/82 backdrop-blur-md"
          : "border-b bg-white"
      }
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {backHref && backLabel && (
            <Link
              href={backHref}
              className={
                glass
                  ? "text-white/80 hover:text-white hover:underline"
                  : "text-green-700 hover:underline"
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
                  ? "text-3xl font-bold text-[#d8f0e0]"
                  : "text-3xl font-bold text-green-700"
              }
            >
              {title}
            </h1>
          )}
        </div>

        <UserMenu profile={profile} />
      </div>
    </header>
  );
}
