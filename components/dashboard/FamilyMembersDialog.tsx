"use client";

import { useEffect, useState } from "react";

import {
  changeFamilyMemberRole,
  getFamilyMembers,
  removeFamilyMember,
  type FamilyMember,
} from "@/app/dashboard/actions";
import { useTranslations } from "@/lib/i18n/client";
import type { InvitationRole } from "@/lib/invitations";

type Props = {
  onClose: () => void;
  familyId: string;
  familyName: string;
};

export default function FamilyMembersDialog({
  onClose,
  familyId,
  familyName,
}: Props) {
  const t = useTranslations("familyMembers");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void getFamilyMembers(familyId).then((result) => {
      if (!active) {
        return;
      }

      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMembers(result.members);
    });

    return () => {
      active = false;
    };
  }, [familyId]);

  async function changeRole(
    member: FamilyMember,
    role: InvitationRole
  ) {
    setBusyUserId(member.user_id);
    setError("");

    try {
      const result = await changeFamilyMemberRole(
        familyId,
        member.user_id,
        role
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMembers((current) =>
        current.map((item) =>
          item.user_id === member.user_id
            ? { ...item, member_role: role }
            : item
        )
      );
    } catch {
      setError(t("roleChangeFailed"));
    } finally {
      setBusyUserId("");
    }
  }

  async function remove(member: FamilyMember) {
    const confirmed = window.confirm(
      t("confirmRemove", {
        name: `${member.first_name} ${member.last_name}`,
      })
    );

    if (!confirmed) {
      return;
    }

    setBusyUserId(member.user_id);
    setError("");

    try {
      const result = await removeFamilyMember(
        familyId,
        member.user_id
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMembers((current) =>
        current.filter((item) => item.user_id !== member.user_id)
      );
    } catch {
      setError(t("removeFailed"));
    } finally {
      setBusyUserId("");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="family-members-title"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="family-members-title"
              className="text-2xl font-bold text-green-700"
            >
              {t("title")}
            </h2>
            <p className="mt-1 text-gray-600">{familyName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-500 hover:text-gray-800"
            aria-label={t("closeWindow")}
          >
            ×
          </button>
        </div>

        {loading ? (
          <p className="mt-8 text-gray-600">{t("loading")}</p>
        ) : (
          <div className="mt-6 max-h-[60vh] space-y-3 overflow-y-auto">
            {members.map((member) => {
              const isOwner = member.member_role === "owner";
              const busy = busyUserId === member.user_id;

              return (
                <div
                  key={member.user_id}
                  className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      @{member.username}
                    </p>
                  </div>

                  {isOwner ? (
                    <span className="text-sm font-medium text-green-700">
                      {t("owner")}
                    </span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <select
                        value={member.member_role}
                        onChange={(event) =>
                          changeRole(
                            member,
                            event.target.value as InvitationRole
                          )
                        }
                        disabled={busy}
                        className="rounded-lg border px-3 py-2"
                      >
                        <option value="editor">{t("editor")}</option>
                        <option value="viewer">{t("viewer")}</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => remove(member)}
                        disabled={busy}
                        className="text-sm text-red-600 hover:underline disabled:opacity-60"
                      >
                        {t("remove")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-5 py-3 hover:bg-gray-100"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
