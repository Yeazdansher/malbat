"use client";

import { useState, useTransition } from "react";

import { createPerson } from "@/app/family/[id]/actions";
import { useTreeRefresh } from "@/components/family/useTreeRefresh";
import { useTranslations } from "@/lib/i18n/client";

type AddPersonDialogProps = {
  familyId: string;
  open: boolean;
  onClose: () => void;

  relatedPersonId?: string;
  secondRelatedPersonId?: string;
  relationshipType?: string;
};

export default function AddPersonDialog({
  familyId,
  open,
  onClose,
  relatedPersonId,
  secondRelatedPersonId,
  relationshipType,
}: AddPersonDialogProps) {
  const t = useTranslations("person");
  const refreshTree = useTreeRefresh();
  const [isDeceased, setIsDeceased] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-green-700">
          {t("addTitle")}
        </h2>

        <form
          className="mt-8 space-y-5"
          action={(formData) => {
            startTransition(async () => {
              await createPerson(familyId, formData);
              onClose();
              refreshTree();
            });
          }}
        >
          <input
            type="hidden"
            name="related_person_id"
            value={relatedPersonId ?? ""}
          />

          <input
            type="hidden"
            name="second_related_person_id"
            value={secondRelatedPersonId ?? ""}
          />

          <input
            type="hidden"
            name="relationship_type"
            value={relationshipType ?? ""}
          />

          <div>
            <label className="mb-2 block font-medium">
              {t("firstName")} {t("requiredMark")}
            </label>
            <input
              name="first_name"
              className="w-full rounded-lg border p-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              {t("lastName")} {t("requiredMark")}
            </label>
            <input
              name="last_name"
              className="w-full rounded-lg border p-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              {t("gender")} {t("requiredMark")}
            </label>
            <select
              name="gender"
              className="w-full rounded-lg border p-3"
              defaultValue=""
              required
            >
              <option value="" disabled>
                {t("selectPlease")}
              </option>
              <option value="male">{t("genderMale")}</option>
              <option value="female">{t("genderFemale")}</option>
              <option value="unknown">{t("genderUnknown")}</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">{t("birthDate")}</label>
            <input
              type="date"
              name="birth_date"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">{t("birthPlace")}</label>
            <input
              name="birth_place"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_deceased"
              checked={isDeceased}
              onChange={(e) => setIsDeceased(e.target.checked)}
            />
            {t("deceased")}
          </label>

          {isDeceased && (
            <>
              <div>
                <label className="mb-2 block font-medium">{t("deathDate")}</label>
                <input
                  type="date"
                  name="death_date"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">{t("deathPlace")}</label>
                <input
                  name="death_place"
                  className="w-full rounded-lg border p-3"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-2 block font-medium">{t("notes")}</label>
            <textarea
              name="notes"
              rows={4}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-5 py-3"
              disabled={pending}
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800 disabled:opacity-60"
            >
              {pending ? t("saving") : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
