import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";
import AuthShell from "@/components/landing/AuthShell";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { getTranslator } from "@/lib/i18n/server";

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
  const t = await getTranslator("register");
  const tCommon = await getTranslator("common");

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <div className="mt-4 flex justify-end">
        <LocaleSwitcher compact />
      </div>

      {error && (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <RegisterForm invite={invite} />

      <div className="mt-6 flex justify-between text-sm">
        <Link href="/" className="text-[#1f7a45] hover:underline">
          {tCommon("backHome")}
        </Link>

        <Link
          href={
            invite
              ? `/login?invite=${encodeURIComponent(invite)}`
              : "/login"
          }
          className="text-[#1f7a45] hover:underline"
        >
          {t("login")}
        </Link>
      </div>
    </AuthShell>
  );
}
