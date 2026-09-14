import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";
import AuthShell from "@/components/landing/AuthShell";

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
    <AuthShell title="Neues Konto erstellen">
      {error && (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <RegisterForm invite={invite} />

      <div className="mt-6 flex justify-between text-sm">
        <Link href="/" className="text-[#1f7a45] hover:underline">
          ← Startseite
        </Link>

        <Link
          href={
            invite
              ? `/login?invite=${encodeURIComponent(invite)}`
              : "/login"
          }
          className="text-[#1f7a45] hover:underline"
        >
          Anmelden
        </Link>
      </div>
    </AuthShell>
  );
}
