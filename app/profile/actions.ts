"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isValidPassword, PASSWORD_REQUIREMENTS } from "@/lib/password";
import { createClient } from "@/lib/supabase/server";

function profileRedirectError(message: string): never {
  redirect(`/profile?error=${encodeURIComponent(message)}`);
}

export async function updateProfile(formData: FormData) {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  if (!firstName || !lastName) {
    profileRedirectError("Vorname und Nachname dürfen nicht leer sein.");
  }

  if (firstName.length > 100 || lastName.length > 100) {
    profileRedirectError(
      "Vorname und Nachname dürfen höchstens 100 Zeichen lang sein."
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("updateProfile (profiles):", profileError);
    profileRedirectError(
      "Das Profil konnte nicht gespeichert werden. Bitte versuche es erneut."
    );
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
    },
  });

  if (metadataError) {
    console.error("updateProfile (auth metadata):", metadataError);
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  redirect("/profile?updated=1");
}

export async function activatePremium() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc("activate_free_premium");

  if (error) {
    console.error("activatePremium:", error);
    redirect(
      `/profile?planError=${encodeURIComponent(
        "Premium konnte nicht aktiviert werden. Bitte versuche es erneut."
      )}#plan`
    );
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  redirect("/profile?planActivated=1#plan");
}

export async function downgradeToFree() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc("downgrade_to_free");

  if (error) {
    console.error("downgradeToFree:", error);
    redirect(
      `/profile?planError=${encodeURIComponent(
        "Der Wechsel auf Free ist fehlgeschlagen. Bitte versuche es erneut."
      )}#plan`
    );
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  redirect("/profile?planDowngraded=1#plan");
}

function passwordRedirectError(message: string): never {
  redirect(`/profile?passwordError=${encodeURIComponent(message)}`);
}

export async function updatePassword(formData: FormData) {
  const currentPassword = String(
    formData.get("current_password") ?? ""
  );
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(
    formData.get("confirm_password") ?? ""
  );

  if (!currentPassword || !newPassword || !confirmPassword) {
    passwordRedirectError("Bitte fülle alle Passwortfelder aus.");
  }

  if (!isValidPassword(newPassword)) {
    passwordRedirectError(PASSWORD_REQUIREMENTS);
  }

  if (newPassword !== confirmPassword) {
    passwordRedirectError(
      "Das neue Passwort und die Bestätigung stimmen nicht überein."
    );
  }

  if (newPassword === currentPassword) {
    passwordRedirectError(
      "Das neue Passwort muss sich vom aktuellen Passwort unterscheiden."
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.email) {
    passwordRedirectError(
      "Das Passwort konnte nicht geändert werden. Bitte versuche es erneut."
    );
  }

  const { error: passwordCheckError } =
    await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

  if (passwordCheckError) {
    passwordRedirectError("Das aktuelle Passwort ist nicht korrekt.");
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("updatePassword:", updateError);
    passwordRedirectError(
      "Das Passwort konnte nicht geändert werden. Bitte versuche es erneut."
    );
  }

  redirect("/profile?passwordUpdated=1");
}

function accountDeleteRedirectError(message: string): never {
  redirect(`/profile?accountDeleteError=${encodeURIComponent(message)}`);
}

export async function deleteAccount(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!password) {
    accountDeleteRedirectError("Bitte gib dein aktuelles Passwort ein.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.email) {
    accountDeleteRedirectError(
      "Das Konto konnte nicht gelöscht werden. Bitte versuche es erneut."
    );
  }

  const { error: passwordError } =
    await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

  if (passwordError) {
    accountDeleteRedirectError("Das eingegebene Passwort ist nicht korrekt.");
  }

  const { error: deleteError } = await supabase.rpc(
    "delete_own_account"
  );

  if (deleteError) {
    console.error("deleteAccount:", deleteError);
    accountDeleteRedirectError(
      "Das Konto konnte nicht gelöscht werden. Bitte versuche es erneut."
    );
  }

  await supabase.auth.signOut();
  redirect("/login?accountDeleted=1");
}
