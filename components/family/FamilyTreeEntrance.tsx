"use client";

import PageEntrance from "@/components/PageEntrance";

type FamilyTreeEntranceProps = {
  familyId: string;
  familyName: string;
  children: React.ReactNode;
};

export default function FamilyTreeEntrance({
  familyId,
  familyName,
  children,
}: FamilyTreeEntranceProps) {
  return (
    <PageEntrance
      eyebrow="Stammbaum"
      title={familyName}
      storageKey={`family:${familyId}`}
    >
      {children}
    </PageEntrance>
  );
}
