import Link from "next/link";
import AuthShell from "@/components/landing/AuthShell";
import { getTranslator } from "@/lib/i18n/server";

type PageProps = {
  searchParams: Promise<{
    invite?: string;
  }>;
};

export default async function CheckEmailPage({ searchParams }: PageProps) {
  const { invite: rawInvite } = await searchParams;
  const t = await getTranslator("checkEmail");
  const invite =
    rawInvite && /^[A-Za-z0-9_-]{43}$/.test(rawInvite)
      ? rawInvite
      : "";

  return (
    <AuthShell title={t("title")}>
      <p className="mt-4 text-center text-gray-600">{t("body")}</p>

      <div className="mt-8 text-center">
        <Link
          href={
            invite
              ? `/login?invite=${encodeURIComponent(invite)}`
              : "/login"
          }
          className="inline-block rounded-lg bg-[#1f7a45] px-6 py-3 font-semibold text-white hover:bg-[#19653a]"
        >
          {t("toLogin")}
        </Link>
      </div>
    </AuthShell>
  );
}
