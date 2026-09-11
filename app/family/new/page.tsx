import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/components/Header";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

import { createFamily } from "./actions";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewFamilyPage({
  searchParams,
}: PageProps) {
  const { error } = await searchParams;
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

      <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-green-700">
          Neue Familie erstellen
        </h1>

        {error === "plan-limit" && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            Dein Free-Tarif erlaubt einen eigenen Stammbaum. Aktiviere
            Premium in deinem Profil, um weitere Stammbäume zu erstellen.
            <Link
              href="/profile#plan"
              className="ml-1 font-semibold underline"
            >
              Tarif verwalten
            </Link>
          </div>
        )}

        <form action={createFamily} className="mt-8 space-y-6">
          <div>
            <label className="mb-2 block font-medium">
              Familienname <span className="text-red-600">*</span>
            </label>

            <input
              name="name"
              type="text"
              placeholder="z. B. Familie Ahmad"
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-green-700 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Beschreibung
            </label>

            <textarea
              name="description"
              rows={4}
              placeholder="Optional"
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-green-700 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg border border-gray-300 px-5 py-3 hover:bg-gray-100"
            >
              Abbrechen
            </Link>

            <button
              type="submit"
              className="rounded-lg bg-green-700 px-6 py-3 font-medium text-white hover:bg-green-800"
            >
              Familie erstellen
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}