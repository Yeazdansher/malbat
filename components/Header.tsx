import Link from "next/link";
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
};

export default function Header({
  title = "MALBAT",
  backHref,
  backLabel,
  profile,
}: HeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {backHref && backLabel && (
            <Link
              href={backHref}
              className="text-green-700 hover:underline"
            >
              ← {backLabel}
            </Link>
          )}

          <h1 className="text-3xl font-bold text-green-700">
            {title}
          </h1>
        </div>

        <UserMenu profile={profile} />
      </div>
    </header>
  );
}