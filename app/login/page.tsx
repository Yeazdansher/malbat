import Link from "next/link";
import { PasswordInput } from "@/components/PasswordInput";
import { login } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    accountDeleted?: string;
    passwordReset?: string;
    invite?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;
  const error = params?.error;
  const accountDeleted = params?.accountDeleted;
  const passwordReset = params?.passwordReset;
  const invite =
    params?.invite && /^[A-Za-z0-9_-]{43}$/.test(params.invite)
      ? params.invite
      : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 className="text-center text-4xl font-bold text-green-700">
          MALBAT
        </h1>

        <h2 className="mt-4 text-center text-lg font-medium text-gray-700">
          Willkommen zurück
        </h2>

        <p className="mt-2 text-center text-gray-500">
          Melde dich bei deinem Familienkonto an.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {accountDeleted === "1" && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            Dein Konto wurde vollständig gelöscht.
          </div>
        )}

        {passwordReset === "1" && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            Dein Passwort wurde geändert. Du kannst dich jetzt anmelden.
          </div>
        )}

        <form action={login} className="mt-8 space-y-4">
          {invite && <input type="hidden" name="invite" value={invite} />}

          <input
            name="email"
            type="email"
            placeholder="E-Mail"
            className="w-full rounded-lg border p-3"
            required
          />

          <PasswordInput
            name="password"
            placeholder="Passwort"
            className="w-full rounded-lg border p-3"
            required
          />

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-green-700 hover:underline"
            >
              Passwort vergessen?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-green-700 py-3 text-white transition hover:bg-green-800"
          >
            Anmelden
          </button>
        </form>

        <div className="mt-6 flex justify-between text-sm">
          <Link href="/" className="text-green-700 hover:underline">
            ← Startseite
          </Link>

          <Link href="/register" className="text-green-700 hover:underline">
            Registrieren
          </Link>
        </div>
      </div>
    </main>
  );
}