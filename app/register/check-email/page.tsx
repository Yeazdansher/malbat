import Link from "next/link";
import AuthShell from "@/components/landing/AuthShell";

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
    <AuthShell title="E-Mail bestätigen">
      <p className="mt-4 text-center text-gray-600">
        Wir haben dir eine Bestätigungs-E-Mail geschickt. Bitte bestätige
        deine E-Mail-Adresse, bevor du dich anmeldest.
      </p>

      <div className="mt-8 text-center">
        <Link
          href={
            invite
              ? `/login?invite=${encodeURIComponent(invite)}`
              : "/login"
          }
          className="inline-block rounded-lg bg-[#1f7a45] px-6 py-3 font-semibold text-white hover:bg-[#19653a]"
        >
          Zur Anmeldung
        </Link>
      </div>
    </AuthShell>
  );
}
