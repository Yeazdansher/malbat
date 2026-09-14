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

export function collectSearchBranch(
  personId: string,
  relationships: Rel[]
): Set<string> {
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
        descendantQueue.push(childId);
      }
    }
  }

  for (const id of [...branch]) {
    for (const partnerId of partnersOf.get(id) ?? []) {
      branch.add(partnerId);
    }
  }

  return branch;
}
