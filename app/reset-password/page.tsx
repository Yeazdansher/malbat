import Link from "next/link";
import { redirect } from "next/navigation";

import AuthShell from "@/components/landing/AuthShell";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { getTranslator } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps) {
  const { error } = await searchParams;
  const t = await getTranslator("resetPassword");
  const tForgot = await getTranslator("forgotPassword");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(tForgot("linkInvalid"))}`
    );
  }

  return (
    <AuthShell title={t("title")}>
      {error && (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <ResetPasswordForm />

      <Link
        href="/login"
        className="mt-6 block text-center text-sm text-[#1f7a45] hover:underline"
      >
        {t("toLogin")}
      </Link>
    </AuthShell>
  );
}
