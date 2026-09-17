import Link from "next/link";
import { PasswordInput } from "@/components/PasswordInput";
import AuthShell from "@/components/landing/AuthShell";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { getTranslator } from "@/lib/i18n/server";
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
  const t = await getTranslator("login");
  const tCommon = await getTranslator("common");

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <div className="mt-4 flex justify-end">
        <LocaleSwitcher compact />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {accountDeleted === "1" && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {t("accountDeleted")}
        </div>
      )}

      {passwordReset === "1" && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {t("passwordReset")}
        </div>
      )}

      <form action={login} className="mt-8 space-y-4">
        {invite && <input type="hidden" name="invite" value={invite} />}

        <input
          name="email"
          type="email"
          placeholder={t("email")}
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#1f7a45] focus:outline-none"
          required
        />

        <PasswordInput
          name="password"
          placeholder={t("password")}
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#1f7a45] focus:outline-none"
          required
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="remember"
              value="1"
              className="h-4 w-4 rounded border-gray-300 accent-[#1f7a45]"
            />
            {t("remember")}
          </label>

          <Link
            href="/forgot-password"
            className="text-sm text-[#1f7a45] hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-[#1f7a45] py-3 font-semibold text-white transition hover:bg-[#19653a]"
        >
          {t("submit")}
        </button>
      </form>

      <div className="mt-6 flex justify-between text-sm">
        <Link href="/" className="text-[#1f7a45] hover:underline">
          {tCommon("backHome")}
        </Link>

        <Link
          href={
            invite
              ? `/register?invite=${encodeURIComponent(invite)}`
              : "/register"
          }
          className="text-[#1f7a45] hover:underline"
        >
          {t("register")}
        </Link>
      </div>
    </AuthShell>
  );
}
