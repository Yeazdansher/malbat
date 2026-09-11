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