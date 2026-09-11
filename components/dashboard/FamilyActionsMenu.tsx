"use client";

import { useEffect, useRef, useState } from "react";

import DeleteFamilyDialog from "@/components/dialogs/DeleteFamilyDialog";
import EditFamilyButton from "./EditFamilyButton";
import FamilyMembersDialog from "./FamilyMembersDialog";
import InviteFamilyDialog from "./InviteFamilyDialog";

type Props = {
  familyId: string;
  familyName: string;
  familyDescription: string | null;
  role: "owner" | "editor" | "viewer";
};

const menuItemClass =
  "block w-full px-4 py-3 text-left text-sm hover:bg-gray-100";

const exportFormats = [
  { format: "gedcom", label: "GEDCOM (.ged)" },
  { format: "json", label: "MALBAT JSON (.json)" },
  { format: "xlsx", label: "Excel (.xlsx)" },
] as const;

export default function FamilyActionsMenu({
  familyId,
  familyName,
  familyDescription,
  role,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isOwner = role === "owner";
  const canInvite = role === "owner" || role === "editor";

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
        setExportOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
    setExportOpen(false);
  }

  return (
    <>
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          onClick={() => {
            setMenuOpen((open) => !open);
            setExportOpen(false);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full text-2xl font-bold text-gray-600 hover:bg-gray-100"
          aria-label="Stammbaum-Aktionen"
          aria-expanded={menuOpen}
        >
          ⋯
        </button>

        <div
          className={
            menuOpen
              ? "absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border bg-white py-1 shadow-lg"
              : "hidden"
          }
        >
          {isOwner && (
            <EditFamilyButton
              familyId={familyId}
              initialName={familyName}
              initialDescription={familyDescription}
              buttonClassName={menuItemClass}
              onClose={closeMenu}
            />
          )}

          {canInvite && (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                setInviteOpen(true);
              }}
              className={menuItemClass}
            >
              Einladen
            </button>
          )}

          {isOwner && (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                setMembersOpen(true);
              }}
              className={menuItemClass}
            >
              Mitglieder ansehen
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((open) => !open)}
              className={`${menuItemClass} flex items-center justify-between`}
              aria-expanded={exportOpen}
            >
              <span>Exportieren</span>
              <span className="text-gray-400">{exportOpen ? "▾" : "▸"}</span>
            </button>

            {exportOpen && (
              <div className="border-t border-gray-100 bg-gray-50 py-1">
                {exportFormats.map((item) => (
                  <a
                    key={item.format}
                    href={`/family/${familyId}/export?format=${item.format}`}
                    className={`${menuItemClass} pl-8 text-gray-700`}
                    onClick={closeMenu}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {isOwner && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  setDeleteOpen(true);
                }}
                className={`${menuItemClass} text-red-600 hover:bg-red-50`}
              >
                Stammbaum löschen
              </button>
            </>
          )}
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

      <DeleteFamilyDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        familyId={familyId}
      />
    </>
  );
}
