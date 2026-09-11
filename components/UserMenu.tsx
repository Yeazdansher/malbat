"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/logout/actions";

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

  const initials = profile
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    : "--";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 font-semibold text-white"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg">
          <Link
            href="/profile"
            className="block px-4 py-3 hover:bg-gray-100"
          >
            👤 Mein Profil
          </Link>

          <Link
            href="/settings"
            className="block px-4 py-3 hover:bg-gray-100"
          >
            ⚙️ Einstellungen
          </Link>

          <hr />

          <form action={logout}>
            <button
              type="submit"
              className="block w-full px-4 py-3 text-left text-red-600 hover:bg-red-50"
            >
              🚪 Abmelden
            </button>
          </form>
        </div>
      )}
    </div>
  );
}