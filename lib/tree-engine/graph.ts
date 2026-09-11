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
          kind: "union",
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
      kind: "union",
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

  function familyOfChild(childId: string): Family | undefined {
    for (const family of familyMap.values()) {
      if (family.children.includes(childId)) {
        return family;
      }
    }

    return undefined;
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

  // --------------------------------------------------
  // Geschwister ohne gemeinsame Eltern verknüpfen
  // --------------------------------------------------

  const siblingParent = new Map<string, string>();

  function findSiblingRoot(id: string): string {
    const parent = siblingParent.get(id) ?? id;

    if (parent === id) {
      return id;
    }

    const root = findSiblingRoot(parent);
    siblingParent.set(id, root);
    return root;
  }

  function linkSiblings(a: string, b: string): void {
    const rootA = findSiblingRoot(a);
    const rootB = findSiblingRoot(b);

    if (rootA !== rootB) {
      siblingParent.set(rootB, rootA);
    }
  }

  for (const relation of relationships) {
    if (relation.relationship_type !== "sibling") {
      continue;
    }

    if (
      !personMap.has(relation.person1_id) ||
      !personMap.has(relation.person2_id)
    ) {
      continue;
    }

    linkSiblings(relation.person1_id, relation.person2_id);
  }

  const siblingClusters = new Map<string, string[]>();

  for (const personId of personMap.keys()) {
    const inSiblingRelation = relationships.some(
      (relation) =>
        relation.relationship_type === "sibling" &&
        (relation.person1_id === personId ||
          relation.person2_id === personId)
    );

    if (!inSiblingRelation) {
      continue;
    }

    const root = findSiblingRoot(personId);
    const cluster = siblingClusters.get(root);

    if (cluster) {
      cluster.push(personId);
    } else {
      siblingClusters.set(root, [personId]);
    }
  }

  for (const cluster of siblingClusters.values()) {
    if (cluster.length < 2) {
      continue;
    }

    const uniqueFamilies = new Set<string>();

    for (const personId of cluster) {
      const family = familyOfChild(personId);
      if (family && family.kind !== "sibling-group") {
        uniqueFamilies.add(family.id);
      }
    }

    if (uniqueFamilies.size === 1) {
      const [familyId] = uniqueFamilies;
      for (const personId of cluster) {
        addChildToFamily(familyId, personId);
      }
      continue;
    }

    if (uniqueFamilies.size > 1) {
      // Uneindeutig: unterschiedliche Elternfamilien — nicht zusammenzwingen.
      continue;
    }

    const members = [...cluster].sort();
    const familyId = `sibling-group:${members.join("|")}`;

    if (familyMap.has(familyId)) {
      continue;
    }

    familyMap.set(familyId, {
      id: familyId,
      partners: [],
      children: members,
      familyNodeId: `family-node:${familyId}`,
      kind: "sibling-group",
    });
  }

  return {
    persons: personMap,
    relationships,
    families: familyMap,
  };
}
