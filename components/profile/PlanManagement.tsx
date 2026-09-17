"use client";

import { useState } from "react";

import { activatePremium, downgradeToFree } from "@/app/profile/actions";
import { useTranslations } from "@/lib/i18n/client";
import type { PlanUsage } from "@/lib/plans";

type Props = {
  usage: PlanUsage | null;
  error?: string;
};

export default function PlanManagement({ usage, error }: Props) {
  const t = useTranslations("plan");
  const initialPremium = usage?.planCode === "premium";
  const [premiumOpen, setPremiumOpen] = useState(
    Boolean(error) && !initialPremium
  );
  const [freeOpen, setFreeOpen] = useState(
    Boolean(error) && Boolean(initialPremium)
  );

  if (!usage) {
    return (
      <section id="plan" className="scroll-mt-24">
        <h2 className="text-xl font-semibold text-gray-900">
          {t("title")}
        </h2>
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {t("loadFailed")}
        </p>
      </section>
    );
  }

  const premium = usage.planCode === "premium";

  return (
    <section id="plan" className="scroll-mt-24">
      <h2 className="text-xl font-semibold text-gray-900">
        {t("title")}
      </h2>

      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <p className="text-sm text-gray-600">{t("currentPlan")}</p>
        <p className="mt-1 text-2xl font-bold text-green-700">
          {premium ? t("premium") : t("free")}
        </p>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-gray-600">{t("ownedTrees")}</dt>
            <dd className="font-semibold">
              {premium
                ? t("unlimited")
                : t("countOf", {
                    current: usage.ownedFamiliesCount,
                    max: usage.maxOwnedFamilies ?? 0,
                  })}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">
              {t("personLimit")}
            </dt>
            <dd className="font-semibold">
              {premium
                ? t("unlimited")
                : t("countOf", {
                    current: usage.ownedPersonsCount,
                    max: usage.maxPersonsPerOwnedFamily ?? 0,
                  })}
            </dd>
          </div>
        </dl>

        {premium ? (
          <div className="mt-5 space-y-4">
            <p className="rounded-lg bg-green-100 px-4 py-3 text-green-800">
              {t("premiumActive")}
            </p>
            <button
              type="button"
              onClick={() => setFreeOpen(true)}
              className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-800 hover:bg-white"
            >
              {t("switchToFree")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPremiumOpen(true)}
            className="mt-6 rounded-lg bg-green-700 px-5 py-3 font-medium text-white hover:bg-green-800"
          >
            {t("upgradeToPremium")}
          </button>
        )}
      </div>

      {premiumOpen && !premium && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="activate-premium-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="activate-premium-title"
                  className="text-2xl font-bold text-green-700"
                >
                  {t("premium")}
                </h2>
                <p className="mt-1 font-medium text-green-700">
                  {t("freeNow")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPremiumOpen(false)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-800"
                aria-label={t("closeWindow")}
              >
                ×
              </button>
            </div>

            <ul className="mt-6 space-y-3 text-gray-700">
              <li>✓ {t("benefitTrees")}</li>
              <li>✓ {t("benefitPersons")}</li>
            </ul>

            <p className="mt-5 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-700">
              {t("invitesNote")}
            </p>

            {error && (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </p>
            )}

            <form action={activatePremium} className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPremiumOpen(false)}
                className="rounded-lg border px-5 py-3 hover:bg-gray-100"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-green-700 px-5 py-3 font-medium text-white hover:bg-green-800"
              >
                {t("activateFree")}
              </button>
            </form>
          </div>
        </div>
      )}

      {freeOpen && premium && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="downgrade-free-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="downgrade-free-title"
                className="text-2xl font-bold text-green-700"
              >
                {t("switchToFree")}
              </h2>
              <button
                type="button"
                onClick={() => setFreeOpen(false)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-800"
                aria-label={t("closeWindow")}
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-3 text-gray-700">
              <p>{t("downgradeHint1")}</p>
              <p>{t("downgradeHint2")}</p>
              <p>{t("downgradeHint3")}</p>
            </div>

            {error && (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </p>
            )}

            <form action={downgradeToFree} className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFreeOpen(false)}
                className="rounded-lg border px-5 py-3 hover:bg-gray-100"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-green-700 px-5 py-3 font-medium text-white hover:bg-green-800"
              >
                {t("switchToFree")}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
