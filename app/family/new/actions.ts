"use server";

import { redirect } from "next/navigation";
import { isOwnedFamilyLimitError } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

export async function createFamily(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim();

  if (!name) {
    throw new Error("Familienname fehlt.");
  }

  const { data: familyId, error: familyError } = await supabase.rpc(
    "create_family_with_owner",
    {
      p_name: name,
      p_description: description || "",
    }
  );

  if (familyError || !familyId) {
    console.error("Supabase Fehler (families):", familyError);

    if (isOwnedFamilyLimitError(familyError)) {
      redirect("/family/new?error=plan-limit");
    }

    throw new Error(
      familyError?.message ?? "Stammbaum konnte nicht erstellt werden."
    );
  }

  redirect(`/family/${familyId}`);
}