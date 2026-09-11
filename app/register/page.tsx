import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    invite?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: PageProps) {
  const { error, invite: rawInvite } = await searchParams;
  const invite =
    rawInvite && /^[A-Za-z0-9_-]{43}$/.test(rawInvite)
      ? rawInvite
      : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 className="text-center text-4xl font-bold text-green-700">
          MALBAT
        </h1>

        <h2 className="mt-6 text-center text-lg font-medium text-gray-700">
          Neues Konto erstellen
        </h2>

        {error && (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <RegisterForm invite={invite} />

        <div className="mt-6 flex justify-between text-sm">
          <Link href="/" className="text-green-700 hover:underline">
            ← Startseite
          </Link>

          <Link
            href={
              invite
                ? `/login?invite=${encodeURIComponent(invite)}`
                : "/login"
            }
            className="text-green-700 hover:underline"
          >
            Anmelden
          </Link>
        </div>
      </div>
    </main>
  );
}
