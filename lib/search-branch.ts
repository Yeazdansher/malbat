/**
 * Such-Hervorhebung (wie Skizze):
 * - Vorfahren (+ deren Partner) und Fokus ? rot
 * - Kinder / Enkel / weitere Nachkommen ? grün
 * - Geschwister und andere Seitenlinien ? nicht markiert
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

export type SearchHighlightSets = {
  /** Fokus + Vorfahren(+Partner) + Nachkommen */
  branch: Set<string>;
  /** Nur Vorfahren inkl. Partner der Vorfahren (ohne Fokus) */
  ancestors: Set<string>;
  /** Nur Nachkommen (ohne Fokus, ohne Partner) */
  descendants: Set<string>;
};

export function collectSearchBranch(
  personId: string,
  relationships: Rel[]
): SearchHighlightSets {
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

  const ancestorQueue = [personId];
  while (ancestorQueue.length > 0) {
    const current = ancestorQueue.pop()!;
    for (const parentId of parentsOf.get(current) ?? []) {
      if (parentId === personId || ancestors.has(parentId)) continue;
      ancestors.add(parentId);
      ancestorQueue.push(parentId);
    }
  }

  // Partner nur der Vorfahren (nicht der Fokusperson) ? rot, wie Elternpaar oben
  for (const ancestorId of [...ancestors]) {
    for (const partnerId of partnersOf.get(ancestorId) ?? []) {
      if (partnerId === personId || descendants.has(partnerId)) continue;
      ancestors.add(partnerId);
    }
  }

  const descendantQueue = [personId];
  while (descendantQueue.length > 0) {
    const current = descendantQueue.pop()!;
    for (const childId of childrenOf.get(current) ?? []) {
      if (
        childId === personId ||
        descendants.has(childId) ||
        ancestors.has(childId)
      ) {
        continue;
      }
      descendants.add(childId);
      descendantQueue.push(childId);
    }
  }

  const branch = new Set<string>([personId, ...ancestors, ...descendants]);
  return { branch, ancestors, descendants };
}
