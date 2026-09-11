import Link from "next/link";

type PageProps = {
  searchParams: Promise<{
    invite?: string;
  }>;
};

export default async function CheckEmailPage({ searchParams }: PageProps) {
  const { invite: rawInvite } = await searchParams;
  const invite =
    rawInvite && /^[A-Za-z0-9_-]{43}$/.test(rawInvite)
      ? rawInvite
      : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
        <h1 className="text-4xl font-bold text-green-700">
          MALBAT
        </h1>

        <h2 className="mt-6 text-xl font-semibold">
          E-Mail bestätigen
        </h2>

        <p className="mt-4 text-gray-600">
          Wir haben dir eine Bestätigungs-E-Mail geschickt.
          Bitte bestätige deine E-Mail-Adresse, bevor du dich anmeldest.
        </p>

        <Link
          href={
            invite
              ? `/login?invite=${encodeURIComponent(invite)}`
              : "/login"
          }
          className="mt-8 inline-block rounded-lg bg-green-700 px-6 py-3 text-white hover:bg-green-800"
        >
          Zur Anmeldung
        </Link>
      </div>
    </main>
  );
}