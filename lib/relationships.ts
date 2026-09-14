import { buildTreeGraph } from "@/lib/tree-engine/graph";
import type { Relationship } from "@/lib/tree-engine/types";

export type RelationshipType =
  | "father"
  | "mother"
  | "partner"
  | "sibling";

export function normalizeRelationshipType(
  relationship: string,
  currentPersonGender: "male" | "female" | "unknown"
): RelationshipType {
  switch (relationship) {
    case "father":
      return "father";

    case "mother":
      return "mother";

    case "partner":
      return "partner";

    case "sibling":
    case "brother":
    case "sister":
      return "sibling";

    case "son":
    case "daughter":
      // Die aktuelle Person ist Vater oder Mutter
      return currentPersonGender === "female"
        ? "mother"
        : "father";

    default:
      throw new Error(
        `Unbekannter Beziehungstyp: ${relationship}`
      );
  }
}

function isPersonParent(
  personId: string,
  relationships: {
    person1_id: string;
    relationship_type: string;
  }[]
): boolean {
  return relationships.some(
    (relation) =>
      relation.person1_id === personId &&
      (relation.relationship_type === "father" ||
        relation.relationship_type === "mother")
  );
}

export type PersonNameRef = {
  id: string;
  first_name: string;
  last_name: string;
  gender?: "male" | "female" | "unknown";
};

function personDisplayName(person: PersonNameRef): string {
  return `${person.first_name} ${person.last_name}`.trim();
}

/**
 * Liefert Anzeigenamen für Eltern, Partner und Kinder einer Person.
 * Konvention: person1 = Elternteil/Partner-A, person2 = Kind/Partner-B
 * bei father/mother/partner.
 *
 * Fehlen direkte Vater/Mutter-Links (z. B. nur Geschwister-Beziehung),
 * werden die Eltern über den Familien-Graphen abgeleitet.
 */
export function getPersonRelationNames(
  personId: string,
  persons: PersonNameRef[],
  relationships: {
    person1_id: string;
    person2_id: string;
    relationship_type: string;
  }[]
): {
  fatherName: string | null;
  motherName: string | null;
  partnerNames: string[];
  childNames: string[];
} {
  const byId = new Map(persons.map((person) => [person.id, person]));

  let fatherName: string | null = null;
  let motherName: string | null = null;
  const partnerNames: string[] = [];
  const childNames: string[] = [];
  const seenPartners = new Set<string>();
  const seenChildren = new Set<string>();

  for (const relation of relationships) {
    if (relation.person2_id === personId) {
      const parent = byId.get(relation.person1_id);
      if (parent) {
        if (relation.relationship_type === "father") {
          fatherName = personDisplayName(parent);
        }
        if (relation.relationship_type === "mother") {
          motherName = personDisplayName(parent);
        }
      }
    }

    if (relation.relationship_type === "partner") {
      const otherId =
        relation.person1_id === personId
          ? relation.person2_id
          : relation.person2_id === personId
            ? relation.person1_id
            : null;

      if (otherId && !seenPartners.has(otherId)) {
        const partner = byId.get(otherId);
        if (partner) {
          seenPartners.add(otherId);
          partnerNames.push(personDisplayName(partner));
        }
      }
    }

    if (
      relation.person1_id === personId &&
      (relation.relationship_type === "father" ||
        relation.relationship_type === "mother" ||
        relation.relationship_type === "parent" ||
        relation.relationship_type === "adoptive-parent")
    ) {
      if (!seenChildren.has(relation.person2_id)) {
        const child = byId.get(relation.person2_id);
        if (child) {
          seenChildren.add(relation.person2_id);
          childNames.push(personDisplayName(child));
        }
      }
    }
  }

  if (!fatherName || !motherName) {
    const inferred = inferParentNamesFromGraph(
      personId,
      persons,
      relationships
    );
    fatherName = fatherName ?? inferred.fatherName;
    motherName = motherName ?? inferred.motherName;
  }

  return { fatherName, motherName, partnerNames, childNames };
}

function inferParentNamesFromGraph(
  personId: string,
  persons: PersonNameRef[],
  relationships: {
    person1_id: string;
    person2_id: string;
    relationship_type: string;
  }[]
): { fatherName: string | null; motherName: string | null } {
  const byId = new Map(persons.map((person) => [person.id, person]));
  const engineRelationships = relationships.filter(
    (relation) =>
      relation.relationship_type === "father" ||
      relation.relationship_type === "mother" ||
      relation.relationship_type === "partner" ||
      relation.relationship_type === "parent" ||
      relation.relationship_type === "adoptive-parent" ||
      relation.relationship_type === "sibling"
  ) as Relationship[];

  const graph = buildTreeGraph([], engineRelationships);

  let fatherName: string | null = null;
  let motherName: string | null = null;

  for (const family of graph.families.values()) {
    if (family.kind === "sibling-group") continue;
    if (!family.children.includes(personId)) continue;

    for (const parentId of family.partners) {
      const parent = byId.get(parentId);
      if (!parent) continue;

      const name = personDisplayName(parent);

      if (parent.gender === "female") {
        motherName = motherName ?? name;
      } else if (parent.gender === "male") {
        fatherName = fatherName ?? name;
      } else if (!fatherName) {
        fatherName = name;
      } else {
        motherName = motherName ?? name;
      }
    }
    break;
  }

  return { fatherName, motherName };
}

export function personHasChildren(
  personId: string,
  relationships: {
    person1_id: string;
    person2_id: string;
    relationship_type: string;
  }[]
): boolean {
  if (isPersonParent(personId, relationships)) {
    return true;
  }

  const engineRelationships = relationships.filter(
    (relation) =>
      relation.relationship_type === "father" ||
      relation.relationship_type === "mother" ||
      relation.relationship_type === "partner" ||
      relation.relationship_type === "parent" ||
      relation.relationship_type === "adoptive-parent" ||
      relation.relationship_type === "sibling"
  ) as Relationship[];

  const graph = buildTreeGraph([], engineRelationships);

  for (const family of graph.families.values()) {
    if (
      family.partners.includes(personId) &&
      family.children.length > 0
    ) {
      return true;
    }
  }

  return false;
}