import { createHash } from "node:crypto";

export type FamilyRole = "owner" | "editor" | "viewer";
export type InvitationRole = Exclude<FamilyRole, "owner">;

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function roleLabel(role: FamilyRole): string {
  if (role === "owner") {
    return "Besitzer";
  }

  if (role === "editor") {
    return "Bearbeiter";
  }

  return "Betrachter";
}
