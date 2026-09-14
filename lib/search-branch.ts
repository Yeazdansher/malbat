/**
 * Personen-Ast für die Suche: Vorfahren, Nachkommen und Partner.
 */

type Rel = {
  person1_id: string;
  person2_id: string;
  relationship_type: string;
};

const PARENT_TYPES = new Set([
  "father",
  "mother",
  "parent",
  "adoptive-parent",
]);

export type SearchBranchSets = {
  /** Gesamter Ast inkl. Fokusperson */
  branch: Set<string>;
  /** Nur Nachkommen (Kinder und weitere Generationen), ohne Fokus */
  descendants: Set<string>;
};

export function collectSearchBranch(
  personId: string,
  relationships: Rel[]
): SearchBranchSets {
  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const partnersOf = new Map<string, string[]>();

  function push(map: Map<string, string[]>, key: string, value: string) {
    const list = map.get(key);
    if (list) {
      if (!list.includes(value)) {
        list.push(value);
      }
    } else {
      map.set(key, [value]);
    }
  }

  for (const relation of relationships) {
    if (PARENT_TYPES.has(relation.relationship_type)) {
      push(parentsOf, relation.person2_id, relation.person1_id);
      push(childrenOf, relation.person1_id, relation.person2_id);
      continue;
    }

    if (relation.relationship_type === "partner") {
      push(partnersOf, relation.person1_id, relation.person2_id);
      push(partnersOf, relation.person2_id, relation.person1_id);
    }
  }

  const branch = new Set<string>([personId]);
  const descendants = new Set<string>();

  const ancestorQueue = [personId];
  while (ancestorQueue.length > 0) {
    const current = ancestorQueue.pop()!;
    for (const parentId of parentsOf.get(current) ?? []) {
      if (!branch.has(parentId)) {
        branch.add(parentId);
        ancestorQueue.push(parentId);
      }
    }
  }

  const descendantQueue = [personId];
  while (descendantQueue.length > 0) {
    const current = descendantQueue.pop()!;
    for (const childId of childrenOf.get(current) ?? []) {
      if (!branch.has(childId)) {
        branch.add(childId);
        descendants.add(childId);
        descendantQueue.push(childId);
      }
    }
  }

  // Partner der Nachkommen → grün (Generation/Haushalt der Kinder)
  for (const id of [...descendants]) {
    for (const partnerId of partnersOf.get(id) ?? []) {
      if (partnerId === personId) continue;
      branch.add(partnerId);
      descendants.add(partnerId);
    }
  }

  // Partner der Fokusperson und der Vorfahren → rot (nicht Nachkommen)
  for (const id of [...branch]) {
    if (descendants.has(id)) continue;
    for (const partnerId of partnersOf.get(id) ?? []) {
      branch.add(partnerId);
    }
  }

  return { branch, descendants };
}
