"use client";

import { useState } from "react";

import EditFamilyButton from "./EditFamilyButton";
import FamilyMembersDialog from "./FamilyMembersDialog";
import InviteFamilyDialog from "./InviteFamilyDialog";

type Props = {
  familyId: string;
  familyName: string;
  familyDescription: string | null;
};

const menuItemClass =
  "block w-full px-4 py-3 text-left text-sm hover:bg-gray-100";

export default function FamilyActionsMenu({
  familyId,
  familyName,
  familyDescription,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-2xl font-bold text-gray-600 hover:bg-gray-100"
          aria-label="Stammbaum-Aktionen"
          aria-expanded={menuOpen}
        >
          ⋯
        </button>

        <div
          className={
            menuOpen
              ? "absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border bg-white py-1 shadow-lg"
              : "hidden"
          }
        >
            <EditFamilyButton
              familyId={familyId}
              initialName={familyName}
              initialDescription={familyDescription}
              buttonClassName={menuItemClass}
              onClose={() => setMenuOpen(false)}
            />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setInviteOpen(true);
              }}
              className={menuItemClass}
            >
              Einladen
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setMembersOpen(true);
              }}
              className={menuItemClass}
            >
              Mitglieder ansehen
            </button>
        </div>
      </div>

      <InviteFamilyDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        familyId={familyId}
        familyName={familyName}
      />

      {membersOpen && (
        <FamilyMembersDialog
          onClose={() => setMembersOpen(false)}
          familyId={familyId}
          familyName={familyName}
        />
      )}
    </>
  );
}
