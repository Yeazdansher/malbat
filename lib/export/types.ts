export type ExportPerson = {
  id: string;
  first_name: string;
  last_name: string;
  gender: "male" | "female" | "unknown";
  birth_date: string | null;
  birth_place: string | null;
  is_deceased: boolean;
  death_date: string | null;
  death_place: string | null;
  notes: string | null;
};

export type ExportRelationship = {
  id: string;
  person1_id: string;
  person2_id: string;
  relationship_type:
    | "partner"
    | "parent"
    | "adoptive-parent"
    | "father"
    | "mother"
    | "sibling";
};

export type ExportFamilyPayload = {
  family: {
    id: string;
    name: string;
    description: string | null;
  };
  persons: ExportPerson[];
  relationships: ExportRelationship[];
  exportedAt: string;
};

export type ExportFormat = "gedcom" | "json" | "xlsx";
