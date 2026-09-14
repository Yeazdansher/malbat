"use client";

import PageEntrance from "@/components/PageEntrance";

type FamilyTreeEntranceProps = {
  familyName: string;
  children: React.ReactNode;
};

export default function FamilyTreeEntrance({
  familyName,
  children,
}: FamilyTreeEntranceProps) {
  return (
    <PageEntrance eyebrow="Stammbaum" title={familyName}>
      {children}
    </PageEntrance>
  );
}
