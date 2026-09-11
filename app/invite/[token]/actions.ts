"use server";

import { redirect } from "next/navigation";

import { hashInvitationToken } from "@/lib/invitations";
import { createClient } from "@/lib/supabase/server";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export async function acceptInvitation(formData: FormData) {
  const token = String(formData.get("token") ?? "");

  if (!TOKEN_PATTERN.test(token)) {
    redirect("/invite/invalid");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?invite=${encodeURIComponent(token)}`);
  }

  const { data: familyId, error } = await supabase.rpc(
    "accept_family_invitation",
    {
      p_token_hash: hashInvitationToken(token),
    }
  );

  if (error || !familyId) {
    console.error("acceptInvitation:", error);
    redirect(
      `/invite/${token}?error=${encodeURIComponent(
        "Die Einladung ist nicht mehr gültig oder wurde bereits verwendet."
      )}`
    );
  }

  redirect(`/family/${familyId}`);
}
