import { redirect } from "next/navigation";

import Header from "@/components/Header";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { APP_VERSION } from "@/lib/version";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  return (
    <main className="min-h-screen bg-gray-100">
      <Header
        backHref="/dashboard"
        backLabel="Dashboard"
        profile={profile}
      />

      <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-green-700">
          Einstellungen
        </h1>

        <div className="mt-8 space-y-6">

          {/* Sprache */}
          <div className="flex items-center justify-between border-b pb-4">
            <label className="font-medium">
              Sprache
            </label>

            <select
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-700 focus:outline-none"
              defaultValue="de"
            >
              <option value="de">Deutsch</option>
            </select>
          </div>

          {/* Design */}
          <div className="flex items-center justify-between border-b pb-4">
            <label className="font-medium">
              Design
            </label>

            <select
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-700 focus:outline-none"
              defaultValue="light"
            >
              <option value="light">Hell</option>
            </select>
          </div>

          {/* Benachrichtigungen */}
          <div className="flex items-center justify-between border-b pb-4">
            <label className="font-medium">
              Benachrichtigungen
            </label>

            <select
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-700 focus:outline-none"
              defaultValue="enabled"
            >
              <option value="enabled">Aktiv</option>
            </select>
          </div>

          {/* Datenschutz */}
          <button
            type="button"
            className="flex w-full items-center justify-between border-b pb-4 text-left transition hover:text-green-700"
          >
            <span className="font-medium">
              Datenschutz
            </span>

            <span className="text-gray-400">
              &gt;
            </span>
          </button>

          {/* Impressum */}
          <button
            type="button"
            className="flex w-full items-center justify-between border-b pb-4 text-left transition hover:text-green-700"
          >
            <span className="font-medium">
              Impressum
            </span>

            <span className="text-gray-400">
              &gt;
            </span>
          </button>

          {/* Version */}
          <div className="flex items-center justify-between border-b pb-4">
            <span className="font-medium">
              Version
            </span>

            <span className="text-gray-500">
              v{APP_VERSION}
            </span>
          </div>

          {/* Copyright */}
          <div className="pt-4 text-center text-sm text-gray-400">
            © 2026 Malbat
          </div>

        </div>
      </div>
    </main>
  );
}