import Link from "next/link";

import BrandMark from "@/components/BrandMark";
import { acceptInvitation } from "./actions";
import { hashInvitationToken } from "@/lib/invitations";
import { getLocale } from "@/lib/i18n/get-locale";
import { getTranslator } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

type InvitationPreview = {
  family_id: string;
  family_name: string;
  invitation_role: "editor" | "viewer";
  expires_at: string;
  invitation_status: "valid" | "expired" | "accepted";
};

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export default async function InvitationPage({
  params,
  searchParams,
}: PageProps) {
  const { token } = await params;
  const { error: actionError } = await searchParams;
  const t = await getTranslator("invitePage");
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let invitation: InvitationPreview | null = null;
  let loadError = false;

  if (TOKEN_PATTERN.test(token)) {
    const { data, error } = await supabase.rpc("get_family_invitation", {
      p_token_hash: hashInvitationToken(token),
    });

    if (error) {
      console.error("InvitationPage:", error);
      loadError = true;
    } else {
      invitation = ((data ?? [])[0] as InvitationPreview | undefined) ?? null;
    }
  }

  const isValid =
    invitation?.invitation_status === "valid" && !loadError;

  const roleText =
    invitation?.invitation_role === "editor"
      ? t("roleEditor")
      : t("roleViewer");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        <Link href="/" className="inline-block">
          <BrandMark className="text-3xl text-green-700" />
        </Link>

        <h1 className="mt-8 text-2xl font-bold">{t("title")}</h1>

        {loadError ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {t("checkFailed")}
          </p>
        ) : !invitation ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {t("invalid")}
          </p>
        ) : invitation.invitation_status === "expired" ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {t("expired")}
          </p>
        ) : invitation.invitation_status === "accepted" ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {t("used")}
          </p>
        ) : (
          <div className="mt-5 space-y-3 text-gray-700">
            <p>
              {t("invitedTo", { name: invitation.family_name })}
            </p>
            <p>{t("yourRole", { role: roleText })}</p>
            <p className="text-sm text-gray-500">
              {t("validUntil", {
                date: new Date(invitation.expires_at).toLocaleString(locale),
              })}
            </p>
          </div>
        )}

        {actionError && (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {actionError}
          </p>
        )}

        {isValid &&
          (user ? (
            <form action={acceptInvitation} className="mt-8">
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="w-full rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800"
              >
                {t("accept")}
              </button>
            </form>
          ) : (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href={`/login?invite=${encodeURIComponent(token)}`}
                className="rounded-lg bg-green-700 px-5 py-3 text-center text-white hover:bg-green-800"
              >
                {t("login")}
              </Link>
              <Link
                href={`/register?invite=${encodeURIComponent(token)}`}
                className="rounded-lg border border-green-700 px-5 py-3 text-center text-green-700 hover:bg-green-50"
              >
                {t("register")}
              </Link>
            </div>
          ))}

        {!isValid && (
          <Link
            href={user ? "/dashboard" : "/"}
            className="mt-8 inline-block text-green-700 hover:underline"
          >
            {t("back")}
          </Link>
        )}
      </div>
    </main>
  );
}
