/**
 * Such-Hervorhebung:
 * - Vorfahren bis Urgroßeltern (+ Partner) → rot
 * - Kinder und Enkel → grün
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

/** Eltern → Großeltern → Urgroßeltern */
const ANCESTOR_GENERATIONS = 3;
/** Kinder → Enkel */
const DESCENDANT_GENERATIONS = 2;

export type SearchBranchSets = {
  /** Fokus + Vorfahren(+Partner) + Nachkommen */
  branch: Set<string>;
  /** Vorfahren bis Urgroßeltern inkl. Partner (ohne Fokus) */
  ancestors: Set<string>;
  /** Kinder und Enkel (ohne Fokus, ohne Partner) */
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

  const ancestors = new Set<string>();
  const descendants = new Set<string>();

  const ancestorQueue: Array<{ id: string; depth: number }> = [
    { id: personId, depth: 0 },
  ];
  while (ancestorQueue.length > 0) {
    const { id: current, depth } = ancestorQueue.pop()!;
    if (depth >= ANCESTOR_GENERATIONS) continue;

    for (const parentId of parentsOf.get(current) ?? []) {
      if (ancestors.has(parentId) || parentId === personId) continue;
      ancestors.add(parentId);
      ancestorQueue.push({ id: parentId, depth: depth + 1 });
    }
  }

  const descendantQueue: Array<{ id: string; depth: number }> = [
    { id: personId, depth: 0 },
  ];
  while (descendantQueue.length > 0) {
    const { id: current, depth } = descendantQueue.pop()!;
    if (depth >= DESCENDANT_GENERATIONS) continue;

    for (const childId of childrenOf.get(current) ?? []) {
      if (descendants.has(childId) || childId === personId) continue;
      if (ancestors.has(childId)) continue;
      descendants.add(childId);
      descendantQueue.push({ id: childId, depth: depth + 1 });
    }
  }

  // Partner der Fokusperson und Vorfahren → rot (wie bisher beim Ast)
  for (const id of [personId, ...ancestors]) {
    for (const partnerId of partnersOf.get(id) ?? []) {
      if (partnerId === personId || descendants.has(partnerId)) continue;
      ancestors.add(partnerId);
    }
  }

  const branch = new Set<string>([personId, ...ancestors, ...descendants]);
  return { branch, ancestors, descendants };
}
