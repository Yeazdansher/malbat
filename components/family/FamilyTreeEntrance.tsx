"use client";

import PageEntrance from "@/components/PageEntrance";
import { useTranslations } from "@/lib/i18n/client";

type FamilyTreeEntranceProps = {
  familyId: string;
  familyName: string;
  children: React.ReactNode;
};

export default function FamilyTreeEntrance({
  familyName,
  children,
}: FamilyTreeEntranceProps) {
  const t = useTranslations("tree");

  return (
    <PageEntrance eyebrow={t("entranceEyebrow")} title={familyName}>
      {children}
    </PageEntrance>
  );
}
