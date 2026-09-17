"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteFamilyTree } from "@/app/family/[id]/actions";
import { PasswordInput } from "@/components/PasswordInput";
import { useTranslations } from "@/lib/i18n/client";

type Props = {
  open: boolean;
  onClose: () => void;
  familyId: string;
};

export default function DeleteFamilyDialog({
  open,
  onClose,
  familyId,
}: Props) {
  const t = useTranslations("deleteFamily");
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) {
    return null;
  }

  function close() {
    setStep(1);
    setPassword("");
    setError("");
    setSaving(false);
    onClose();
  }

  if (step === 1) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-green-700">
            {t("title")}
          </h2>

          <div className="mt-4 space-y-3 text-gray-700">
            <p>{t("warning1")}</p>
            <p>{t("warning2")}</p>
            <p>{t("warning3")}</p>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={close}
              className="rounded-lg border px-5 py-3 hover:bg-gray-100"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep(2);
              }}
              className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700"
            >
              {t("continue")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-green-700">
          {t("confirmTitle")}
        </h2>

        <p className="mt-4 text-gray-700">{t("confirmHint")}</p>

        <label className="mt-6 mb-2 block font-medium">{t("password")}</label>
        <PasswordInput
          autoComplete="current-password"
          className="w-full rounded-lg border p-3"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && (
          <p className="mt-4 text-red-600">{error}</p>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={close}
            className="rounded-lg border px-5 py-3 hover:bg-gray-100"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={saving || password.trim().length === 0}
            className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700 disabled:opacity-60"
            onClick={async () => {
              setError("");
              setSaving(true);

              try {
                const result = await deleteFamilyTree(familyId, password);

                if (!result.ok) {
                  setSaving(false);
                  setError(result.error);
                  return;
                }

                router.push("/dashboard?familyDeleted=1");
              } catch {
                setSaving(false);
                setError(t("genericError"));
              }
            }}
          >
            {t("confirmDelete")}
          </button>
        </div>
      </div>
    </div>
  );
}
