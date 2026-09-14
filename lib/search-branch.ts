/**
 * Search highlight using the same family graph as the tree:
 * - upward (families where the person is a child) -> red
 * - downward (families where the person is a partner) -> green
 *
 * The focus person's partner and that partner's ancestors are not highlighted.
 */

import { buildTreeGraph } from "@/lib/tree-engine/graph";
import type { Relationship } from "@/lib/tree-engine/types";

export type SearchHighlightSets = {
  branch: Set<string>;
  ancestors: Set<string>;
  descendants: Set<string>;
  /** Family nodes on the ancestor path (red) */
  ancestorFamilyIds: Set<string>;
  /** Family nodes on the descendant path (green) */
  descendantFamilyIds: Set<string>;
};

export function collectSearchBranch(
  personId: string,
  relationships: Relationship[]
): SearchHighlightSets {
  const graph = buildTreeGraph([], relationships);
  const families = [...graph.families.values()];

  const ancestors = new Set<string>();
  const descendants = new Set<string>();
  const ancestorFamilyIds = new Set<string>();
  const descendantFamilyIds = new Set<string>();

  const upQueue = [personId];
  const seenUp = new Set<string>([personId]);

  while (upQueue.length > 0) {
    const current = upQueue.pop()!;

    for (const family of families) {
      if (family.kind === "sibling-group") continue;
      if (!family.children.includes(current)) continue;

      ancestorFamilyIds.add(family.familyNodeId);

      for (const parentId of family.partners) {
        if (seenUp.has(parentId)) continue;
        seenUp.add(parentId);
        ancestors.add(parentId);
        upQueue.push(parentId);
      }
    }
  }

  const downQueue = [personId];
  const seenDown = new Set<string>([personId]);

  while (downQueue.length > 0) {
    const current = downQueue.pop()!;

    for (const family of families) {
      if (family.kind === "sibling-group") continue;
      if (!family.partners.includes(current)) continue;

      descendantFamilyIds.add(family.familyNodeId);

      for (const childId of family.children) {
        if (seenDown.has(childId) || ancestors.has(childId)) continue;
        seenDown.add(childId);
        descendants.add(childId);
        downQueue.push(childId);
      }
    }
  }

  const branch = new Set<string>([personId, ...ancestors, ...descendants]);
  return {
    branch,
    ancestors,
    descendants,
    ancestorFamilyIds,
    descendantFamilyIds,
  };
}
