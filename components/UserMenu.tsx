"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/logout/actions";
import Avatar from "@/components/Avatar";
import { useTranslations } from "@/lib/i18n/client";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url: string | null;
} | null;

type UserMenuProps = {
  profile?: Profile;
};

export default function UserMenu({ profile }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("header");

  const initials = profile
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    : "--";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-green-700 ring-2 ring-white/25 font-semibold text-white"
        aria-label={t("userMenu")}
      >
        <Avatar
          url={profile?.avatar_url}
          initials={initials}
          sizeClassName="h-10 w-10"
          textClassName="text-sm font-semibold text-white"
        />
      </button>

      {open && (
        <div className="absolute end-0 z-50 mt-2 w-56 rounded-xl border bg-white shadow-lg">
          <Link
            href="/profile"
            className="block px-4 py-3 hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            👤 {t("myProfile")}
          </Link>

          <Link
            href="/settings"
            className="block px-4 py-3 hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            ⚙️ {t("settings")}
          </Link>

          <hr />

          <form action={logout}>
            <button
              type="submit"
              className="block w-full px-4 py-3 text-start text-red-600 hover:bg-red-50"
            >
              🚪 {t("logout")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
