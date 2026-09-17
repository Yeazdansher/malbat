"use client";

import { useState } from "react";

import { deleteAccount } from "@/app/profile/actions";
import { PasswordInput } from "@/components/PasswordInput";
import { useTranslations } from "@/lib/i18n/client";

type Props = {
  error?: string;
};

export default function DeleteAccountButton({ error }: Props) {
  const t = useTranslations("deleteAccount");
  const [open, setOpen] = useState(Boolean(error));
  const [step, setStep] = useState<1 | 2>(error ? 2 : 1);

  function close() {
    setOpen(false);
    setStep(1);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-red-600 hover:underline"
      >
        {t("title")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="delete-account-title"
                className="text-2xl font-bold text-red-700"
              >
                {t("title")}
              </h2>

              <button
                type="button"
                onClick={close}
                className="text-2xl leading-none text-gray-500 hover:text-gray-800"
                aria-label={t("closeWindow")}
              >
                ×
              </button>
            </div>

            {step === 1 ? (
              <>
                <div className="mt-5 space-y-3 text-gray-700">
                  <p>{t("warning1")}</p>
                  <p>{t("warning2")}</p>
                  <p className="font-semibold text-red-700">
                    {t("warning3")}
                  </p>
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
                    onClick={() => setStep(2)}
                    className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700"
                  >
                    {t("continue")}
                  </button>
                </div>
              </>
            ) : (
              <form action={deleteAccount} className="mt-5 space-y-5">
                <p className="text-gray-700">{t("confirmHint")}</p>

                {error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                    {error}
                  </p>
                )}

                <div>
                  <label
                    htmlFor="delete_account_password"
                    className="mb-2 block font-medium"
                  >
                    {t("currentPassword")}
                  </label>
                  <PasswordInput
                    id="delete_account_password"
                    name="password"
                    autoComplete="current-password"
                    className="w-full rounded-lg border p-3"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg border px-5 py-3 hover:bg-gray-100"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700"
                  >
                    {t("confirmDelete")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
