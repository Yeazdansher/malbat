import { redirect } from "next/navigation";

import { updateProfile } from "@/app/profile/actions";
import Header from "@/components/Header";
import ChangePasswordButton from "@/components/profile/ChangePasswordButton";
import DeleteAccountButton from "@/components/profile/DeleteAccountButton";
import PlanManagement from "@/components/profile/PlanManagement";
import { getCurrentPlanUsage } from "@/lib/plans";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    updated?: string;
    error?: string;
    passwordUpdated?: string;
    passwordError?: string;
    accountDeleteError?: string;
    planActivated?: string;
    planDowngraded?: string;
    planError?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: PageProps) {
  const {
    updated,
    error,
    passwordUpdated,
    passwordError,
    accountDeleteError,
    planActivated,
    planDowngraded,
    planError,
  } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, planUsage] = await Promise.all([
    getCurrentProfile(),
    getCurrentPlanUsage(),
  ]);
  const metadata = user.user_metadata;
  const firstName =
    profile?.first_name ?? String(metadata.first_name ?? "");
  const lastName =
    profile?.last_name ?? String(metadata.last_name ?? "");
  const username =
    profile?.username ?? String(metadata.username ?? "");
  const email = user.email ?? "";
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
    email.charAt(0).toUpperCase() ||
    "--";

  return (
    <main className="min-h-screen bg-gray-100">
      <Header
        backHref="/dashboard"
        backLabel="Dashboard"
        profile={profile}
      />

      <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-green-700">
          Mein Profil
        </h1>

        {updated === "1" && (
          <p className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            Deine Änderungen wurden gespeichert.
          </p>
        )}

        {passwordUpdated === "1" && (
          <p className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            Dein Passwort wurde geändert.
          </p>
        )}

        {planActivated === "1" && (
          <p className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            Premium wurde kostenlos aktiviert.
          </p>
        )}

        {planDowngraded === "1" && (
          <p className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            Du nutzt jetzt wieder Free. Zusätzliche eigene Stammbäume wurden
            gesperrt.
          </p>
        )}

        {error && (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-col items-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-green-700 text-4xl font-bold text-white">
            {initials}
          </div>

          <button className="mt-4 text-green-700 hover:underline">
            Profilbild ändern
          </button>
        </div>

        <form action={updateProfile} className="mt-10 space-y-6">
          <div>
            <label htmlFor="first_name" className="mb-2 block font-medium">
              Vorname
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              className="w-full rounded-lg border p-3"
              defaultValue={firstName}
              maxLength={100}
              required
            />
          </div>

          <div>
            <label htmlFor="last_name" className="mb-2 block font-medium">
              Nachname
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              className="w-full rounded-lg border p-3"
              defaultValue={lastName}
              maxLength={100}
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="mb-2 block font-medium">
              Benutzername
            </label>
            <input
              id="username"
              type="text"
              className="w-full cursor-not-allowed rounded-lg border bg-gray-100 p-3 text-gray-600"
              defaultValue={username}
              disabled
            />
            <p className="mt-1 text-sm text-gray-500">
              Der Benutzername kann nicht geändert werden.
            </p>
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block font-medium">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              className="w-full cursor-not-allowed rounded-lg border bg-gray-100 p-3 text-gray-600"
              defaultValue={email}
              disabled
            />
            <p className="mt-1 text-sm text-gray-500">
              Die E-Mail-Adresse kann nicht geändert werden.
            </p>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-green-700 px-6 py-3 text-white hover:bg-green-800"
          >
            Änderungen speichern
          </button>
        </form>

        <div className="mt-6 space-y-6">
          <hr />

          <PlanManagement usage={planUsage} error={planError} />

          <hr />

          <ChangePasswordButton error={passwordError} />

          <hr />

          <DeleteAccountButton error={accountDeleteError} />
        </div>
      </div>
    </main>
  );
}