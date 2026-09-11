import Link from "next/link";

import { acceptInvitation } from "./actions";
import { hashInvitationToken, roleLabel } from "@/lib/invitations";
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        <Link href="/" className="text-3xl font-bold text-green-700">
          MALBAT
        </Link>

        <h1 className="mt-8 text-2xl font-bold">
          Einladung zum Stammbaum
        </h1>

        {loadError ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Die Einladung konnte nicht geprüft werden. Bitte versuche es
            später erneut.
          </p>
        ) : !invitation ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Dieser Einladungslink ist ungültig.
          </p>
        ) : invitation.invitation_status === "expired" ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Dieser Einladungslink ist abgelaufen.
          </p>
        ) : invitation.invitation_status === "accepted" ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Dieser Einladungslink wurde bereits verwendet.
          </p>
        ) : (
          <div className="mt-5 space-y-3 text-gray-700">
            <p>
              Du wurdest zum Stammbaum{" "}
              <strong>{invitation.family_name}</strong> eingeladen.
            </p>
            <p>
              Deine Rolle:{" "}
              <strong>{roleLabel(invitation.invitation_role)}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Gültig bis{" "}
              {new Date(invitation.expires_at).toLocaleString("de-DE")}
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
                Einladung annehmen
              </button>
            </form>
          ) : (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href={`/login?invite=${encodeURIComponent(token)}`}
                className="rounded-lg bg-green-700 px-5 py-3 text-center text-white hover:bg-green-800"
              >
                Anmelden
              </Link>
              <Link
                href={`/register?invite=${encodeURIComponent(token)}`}
                className="rounded-lg border border-green-700 px-5 py-3 text-center text-green-700 hover:bg-green-50"
              >
                Konto erstellen
              </Link>
            </div>
          ))}

        {!isValid && (
          <Link
            href={user ? "/dashboard" : "/"}
            className="mt-8 inline-block text-green-700 hover:underline"
          >
            Zurück
          </Link>
        )}
      </div>
    </main>
  );
}
