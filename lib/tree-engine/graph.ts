import type {
  Person,
  Relationship,
  Family,
  TreeGraph,
} from "./types";

/**
 * Erstellt den internen TreeGraph.
 *
 * Diese Funktion enthält ausschließlich
 * fachliche Logik und kennt weder Layout
 * noch React Flow.
 */
export function buildTreeGraph(
  persons: Person[],
  relationships: Relationship[]
): TreeGraph {
  const personMap = new Map<string, Person>();

  for (const person of persons) {
    personMap.set(person.id, person);
  }

  const familyMap = new Map<string, Family>();
  const partnerIndex = new Map<string, string>();
  const parentsOfChild = new Map<string, Set<string>>();

  // --------------------------------------------------
  // Beziehungen analysieren
  // --------------------------------------------------

  for (const relation of relationships) {
    switch (relation.relationship_type) {
      case "partner": {
        const partners = [
          relation.person1_id,
          relation.person2_id,
        ].sort();

        const key = partners.join("|");

        if (partnerIndex.has(key)) {
          break;
        }

        const familyId = `family:${key}`;

        familyMap.set(familyId, {
          id: familyId,
          partners,
          children: [],
          familyNodeId: `family-node:${familyId}`,
        });

        partnerIndex.set(key, familyId);
        break;
      }

      case "parent":
      case "adoptive-parent":
      case "father":
      case "mother": {
        let parents = parentsOfChild.get(
          relation.person2_id
        );

        if (!parents) {
          parents = new Set<string>();
          parentsOfChild.set(
            relation.person2_id,
            parents
          );
        }

        parents.add(relation.person1_id);
        break;
      }
    }
  }

  function familyKey(personIds: string[]): string {
    return [...personIds].sort().join("|");
  }

  function ensureFamily(personIds: string[]): string {
    const partners = [...personIds].sort();
    const key = familyKey(partners);
    const existingId = partnerIndex.get(key);

    if (existingId) {
      return existingId;
    }

    const familyId = `family:${key}`;

    familyMap.set(familyId, {
      id: familyId,
      partners,
      children: [],
      familyNodeId: `family-node:${familyId}`,
    });

    partnerIndex.set(key, familyId);
    return familyId;
  }

  function addChildToFamily(familyId: string, childId: string): void {
    const family = familyMap.get(familyId);

    if (!family || family.children.includes(childId)) {
      return;
    }

    family.children.push(childId);
  }

  function unionsOf(personId: string): Family[] {
    return [...familyMap.values()].filter((family) =>
      family.partners.includes(personId)
    );
  }

  // --------------------------------------------------
  // Kinder den Familien zuordnen
  // --------------------------------------------------

  for (const [childId, parentSet] of parentsOfChild) {
    const parents = [...parentSet];

    if (parents.length === 0) {
      continue;
    }

    if (parents.length >= 2) {
      addChildToFamily(ensureFamily(parents), childId);
      continue;
    }

    const parentUnions = unionsOf(parents[0]);

    if (parentUnions.length > 0) {
      addChildToFamily(parentUnions[0].id, childId);
      continue;
    }

    addChildToFamily(ensureFamily(parents), childId);
  }

  return {
    persons: personMap,
    relationships,
    families: familyMap,
  };
}