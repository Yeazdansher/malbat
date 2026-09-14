import type {
  TreeGraph,
  TreeLayout,
  LayoutNode,
  LayoutEdge,
  Family,
} from "./types";

const CARD_WIDTH = 270;
const CARD_HEIGHT = 176;
const FAMILY_NODE_SIZE = 32;

const PARTNER_GAP = 56;
const SIBLING_GAP = 40;
const FAMILY_GAP = 80;
const GENERATION_GAP = 260;

const START_X = 100;
const START_Y = 100;

const GENDER_ORDER: Record<string, number> = {
  male: 0,
  unknown: 1,
  female: 2,
};

/**
 * Rekursive Layout-Engine.
 *
 * Partner einer Person stehen neben dieser Person.
 * Kinder hängen am Familienpunkt der Eltern
 * und werden unter diesem Punkt ausgerichtet.
 * Schwiegerkinder sind keine Kinder.
 */
export function buildTreeLayout(graph: TreeGraph): TreeLayout {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  const placedPersons = new Set<string>();
  const placedFamilies = new Set<string>();
  const personPositions = new Map<string, { x: number; y: number }>();
  const subtreeWidth = new Map<string, number>();
  const edgeKeys = new Set<string>();

  const familiesByPartner = new Map<string, Family[]>();
  const familyByChild = new Map<string, Family>();

  for (const family of graph.families.values()) {
    for (const partnerId of family.partners) {
      const list = familiesByPartner.get(partnerId);
      if (list) {
        list.push(family);
      } else {
        familiesByPartner.set(partnerId, [family]);
      }
    }

    for (const childId of family.children) {
      if (!familyByChild.has(childId)) {
        familyByChild.set(childId, family);
      }
    }
  }

  function partnerRowWidth(partnerCount: number): number {
    if (partnerCount <= 0) {
      return 0;
    }

    if (partnerCount === 1) {
      return CARD_WIDTH;
    }

    return partnerCount * CARD_WIDTH + (partnerCount - 1) * PARTNER_GAP;
  }

  function orderPartners(partnerIds: string[]): string[] {
    return [...partnerIds].sort((a, b) => {
      const genderA = graph.persons.get(a)?.gender ?? "unknown";
      const genderB = graph.persons.get(b)?.gender ?? "unknown";
      const rankA = GENDER_ORDER[genderA] ?? 1;
      const rankB = GENDER_ORDER[genderB] ?? 1;

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      return a.localeCompare(b);
    });
  }

  function addEdge(source: string, target: string): void {
    const key = `${source}->${target}`;

    if (edgeKeys.has(key)) {
      return;
    }

    edgeKeys.add(key);
    edges.push({ source, target });
  }

  function addFamilyNode(
    family: Family,
    centerX: number,
    centerY: number
  ): void {
    nodes.push({
      type: "family",
      id: family.familyNodeId,
      familyId: family.id,
      position: {
        x: centerX - FAMILY_NODE_SIZE / 2,
        y: centerY - FAMILY_NODE_SIZE / 2,
      },
    });
  }

  function unionsOf(
    personId: string,
    stack: Set<string>
  ): Family[] {
    const families = familiesByPartner.get(personId) ?? [];
    return families.filter((family) => !stack.has(family.id));
  }

  function childIdsOf(family: Family): string[] {
    return family.children
      .filter((id) => graph.persons.has(id))
      .sort((a, b) => {
        const birthA = graph.persons.get(a)?.birth_date ?? null;
        const birthB = graph.persons.get(b)?.birth_date ?? null;

        if (birthA && birthB && birthA !== birthB) {
          // Ältere Kinder (früher geboren) links.
          return birthA.localeCompare(birthB);
        }

        if (birthA && !birthB) {
          return -1;
        }

        if (!birthA && birthB) {
          return 1;
        }

        return a.localeCompare(b);
      });
  }

  function otherPartnersOf(family: Family, personId: string): string[] {
    return family.partners.filter(
      (id) => id !== personId && graph.persons.has(id)
    );
  }

  function measureExtraUnionsOwnGen(
    personId: string,
    skipFamilyId: string,
    visited: Set<string>
  ): number {
    const unions = (familiesByPartner.get(personId) ?? []).filter(
      (family) =>
        !placedFamilies.has(family.id) && family.id !== skipFamilyId
    );

    let width = 0;

    for (const union of unions) {
      const others = otherPartnersOf(union, personId).filter(
        (id) => !visited.has(id)
      );

      for (const partnerId of others) {
        width += PARTNER_GAP + CARD_WIDTH;
        visited.add(partnerId);
        width += measureExtraUnionsOwnGen(partnerId, union.id, visited);
      }
    }

    return width;
  }

  function measureOwnGenerationWidth(personId: string): number {
    if (!graph.persons.has(personId)) {
      return 0;
    }

    const unions = unionsForPerson(personId);

    if (unions.length === 0) {
      return CARD_WIDTH;
    }

    // Erste Union rechts vom Anker; weitere Unions links — wie placePersonWithPartners.
    const visited = new Set<string>([personId]);
    let leftWidth = 0;
    let rightWidth = CARD_WIDTH;

    const first = unions[0];
    const firstOthers = otherPartnersOf(first, personId);

    for (const partnerId of firstOthers) {
      rightWidth += PARTNER_GAP + CARD_WIDTH;
      visited.add(partnerId);
      rightWidth += measureExtraUnionsOwnGen(partnerId, first.id, visited);
    }

    if (firstOthers.length === 0) {
      rightWidth += PARTNER_GAP;
    }

    for (let index = 1; index < unions.length; index++) {
      const union = unions[index];
      const others = otherPartnersOf(union, personId);

      for (const partnerId of others) {
        leftWidth += PARTNER_GAP + CARD_WIDTH;
        visited.add(partnerId);
        leftWidth += measureExtraUnionsOwnGen(partnerId, union.id, visited);
      }
    }

    return leftWidth + rightWidth;
  }

  function measurePersonSubtree(
    personId: string,
    stack: Set<string>
  ): number {
    if (!graph.persons.has(personId)) {
      return 0;
    }

    const unions = unionsOf(personId, stack).filter(
      (family) => !placedFamilies.has(family.id)
    );

    if (unions.length === 0) {
      return CARD_WIDTH;
    }

    let rowWidth = CARD_WIDTH;
    let descendantsWidth = 0;

    for (const union of unions) {
      const others = otherPartnersOf(union, personId);
      rowWidth += others.length * (PARTNER_GAP + CARD_WIDTH);

      stack.add(union.id);

      const kids = childIdsOf(union);
      let kidsWidth = 0;

      for (let index = 0; index < kids.length; index++) {
        if (index > 0) {
          kidsWidth += SIBLING_GAP;
        }

        kidsWidth += measurePersonSubtree(kids[index], stack);
      }

      stack.delete(union.id);
      descendantsWidth = Math.max(descendantsWidth, kidsWidth);
    }

    return Math.max(rowWidth, descendantsWidth, CARD_WIDTH);
  }

  function measureFamily(family: Family, stack: Set<string>): number {
    const cached = subtreeWidth.get(family.id);

    if (cached !== undefined) {
      return cached;
    }

    if (stack.has(family.id)) {
      return partnerRowWidth(family.partners.length);
    }

    stack.add(family.id);

    const rowWidth = partnerRowWidth(family.partners.length);
    const kids = childIdsOf(family);
    let childrenWidth = 0;

    for (let index = 0; index < kids.length; index++) {
      if (index > 0) {
        childrenWidth += SIBLING_GAP;
      }

      childrenWidth += measurePersonSubtree(kids[index], stack);
    }

    stack.delete(family.id);

    const partners = orderPartners(family.partners);
    const extraStack = new Set(stack);
    extraStack.add(family.id);

    const extraLeft =
      partners.length > 0
        ? measureExtraUnions(partners[0], extraStack)
        : 0;
    const extraRight =
      partners.length > 1
        ? measureExtraUnions(
            partners[partners.length - 1],
            extraStack
          )
        : 0;

    const width =
      Math.max(rowWidth, childrenWidth, CARD_WIDTH) + extraLeft + extraRight;
    subtreeWidth.set(family.id, width);
    return width;
  }

  function placePerson(personId: string, x: number, y: number): void {
    if (placedPersons.has(personId) || !graph.persons.has(personId)) {
      return;
    }

    placedPersons.add(personId);
    personPositions.set(personId, { x, y });

    nodes.push({
      type: "person",
      id: personId,
      position: { x, y },
    });
  }

  function nodeIdsSnapshot(): Set<string> {
    return new Set(nodes.map((node) => node.id));
  }

  function newNodeIdsSince(before: Set<string>): string[] {
    return nodes
      .filter((node) => !before.has(node.id))
      .map((node) => node.id);
  }

  function generationRowBounds(
    nodeIds: string[],
    generationY: number
  ): { left: number; right: number } | null {
    let left = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;

    for (const id of nodeIds) {
      const node = nodes.find((entry) => entry.id === id);
      if (!node || node.type !== "person") {
        continue;
      }

      if (Math.abs(node.position.y - generationY) > 1) {
        continue;
      }

      left = Math.min(left, node.position.x);
      right = Math.max(right, node.position.x + CARD_WIDTH);
    }

    if (!Number.isFinite(left) || !Number.isFinite(right)) {
      return null;
    }

    return { left, right };
  }

  /** Pro Y-Zeile die Karten-Bounds — verhindert Cousin-Kollisionen ohne volle AABB-Schienen. */
  function boundsByGeneration(
    nodeIds: string[]
  ): Map<number, { left: number; right: number }> {
    const byY = new Map<number, { left: number; right: number }>();

    for (const id of nodeIds) {
      const node = nodes.find((entry) => entry.id === id);
      if (!node || node.type !== "person") {
        continue;
      }

      const y = node.position.y;
      const existing = byY.get(y);

      if (existing) {
        existing.left = Math.min(existing.left, node.position.x);
        existing.right = Math.max(existing.right, node.position.x + CARD_WIDTH);
      } else {
        byY.set(y, {
          left: node.position.x,
          right: node.position.x + CARD_WIDTH,
        });
      }
    }

    return byY;
  }

  function shiftSubtree(nodeIds: string[], dx: number): void {
    if (dx === 0) {
      return;
    }

    for (const id of nodeIds) {
      const node = nodes.find((entry) => entry.id === id);
      if (node) {
        node.position.x += dx;
      }

      const personPos = personPositions.get(id);
      if (personPos) {
        personPos.x += dx;
      }
    }
  }

  function requiredOverlapShift(leftIds: string[], rightIds: string[]): number {
    const leftByY = boundsByGeneration(leftIds);
    const rightByY = boundsByGeneration(rightIds);
    let shift = 0;

    for (const [y, rightBounds] of rightByY) {
      const leftBounds = leftByY.get(y);
      if (!leftBounds) {
        continue;
      }

      const needed = leftBounds.right + SIBLING_GAP - rightBounds.left;
      if (needed > shift) {
        shift = needed;
      }
    }

    return shift;
  }

  function resolveSiblingOverlaps(subtreeNodeIds: string[][]): void {
    const groups = subtreeNodeIds.filter((ids) => ids.length > 0);

    for (let index = 1; index < groups.length; index++) {
      const shift = requiredOverlapShift(groups[index - 1], groups[index]);
      if (shift > 0) {
        shiftSubtree(groups[index], shift);
      }
    }
  }

  function recenterSiblingBlock(
    subtreeNodeIds: string[][],
    targetCenterX: number,
    generationY: number
  ): void {
    const allIds = subtreeNodeIds.flat();
    if (allIds.length === 0) {
      return;
    }

    const bounds = generationRowBounds(allIds, generationY);
    if (!bounds) {
      return;
    }

    const currentCenter = (bounds.left + bounds.right) / 2;
    shiftSubtree(allIds, targetCenterX - currentCenter);
  }

  function captureSubtree(before: Set<string>, rootPersonId: string): string[] {
    const ids = newNodeIdsSince(before);
    if (!ids.includes(rootPersonId) && placedPersons.has(rootPersonId)) {
      ids.push(rootPersonId);
    }
    return ids;
  }

  function moveFamilyNodeTo(familyNodeId: string, centerX: number, centerY: number): void {
    const node = nodes.find((entry) => entry.id === familyNodeId);
    if (!node) {
      return;
    }

    node.position.x = centerX - FAMILY_NODE_SIZE / 2;
    node.position.y = centerY - FAMILY_NODE_SIZE / 2;
  }

  function placeChildren(
    family: Family,
    familyCenterX: number,
    y: number
  ): void {
    const kids = childIdsOf(family);

    if (kids.length === 0) {
      return;
    }

    const childWidths = kids.map((id) => measureOwnGenerationWidth(id));

    const offsets: number[] = [];
    let offset = 0;

    for (let index = 0; index < kids.length; index++) {
      offsets.push(offset);
      offset += childWidths[index] + SIBLING_GAP;
    }

    const childCenterSum = offsets.reduce(
      (sum, childOffset, index) =>
        sum + childOffset + childWidths[index] / 2,
      0
    );
    const childCenterAverage = childCenterSum / kids.length;
    const blockLeft = familyCenterX - childCenterAverage;

    const subtreeNodeIds: string[][] = [];

    for (let index = 0; index < kids.length; index++) {
      const childId = kids[index];
      const before = nodeIdsSnapshot();
      placePersonWithPartners(childId, blockLeft + offsets[index], y);
      addEdge(family.familyNodeId, childId);
      subtreeNodeIds.push(captureSubtree(before, childId));
    }

    resolveSiblingOverlaps(subtreeNodeIds);
    recenterSiblingBlock(subtreeNodeIds, familyCenterX, y);
  }

  function preferredExtraDirection(personId: string): "left" | "right" {
    const origin = personPositions.get(personId);
    if (!origin) {
      return "right";
    }

    for (const family of familiesByPartner.get(personId) ?? []) {
      if (!placedFamilies.has(family.id)) {
        continue;
      }

      for (const partnerId of otherPartnersOf(family, personId)) {
        const partnerPos = personPositions.get(partnerId);
        if (!partnerPos) {
          continue;
        }

        // Bestehender Partner rechts → weitere Partner links (und umgekehrt).
        if (partnerPos.x >= origin.x) {
          return "left";
        }

        return "right";
      }
    }

    return "right";
  }

  function unionsForPerson(personId: string): Family[] {
    return (familiesByPartner.get(personId) ?? [])
      .filter((family) => !placedFamilies.has(family.id))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  function placePersonWithPartners(
    personId: string,
    x: number,
    y: number
  ): void {
    const unions = unionsForPerson(personId);

    // Weitere Unions links vom Anker reservieren, damit Geschwister-Packing stimmt.
    let leftWidth = 0;
    if (unions.length > 1) {
      const visited = new Set<string>([personId]);
      for (let index = 1; index < unions.length; index++) {
        const union = unions[index];
        for (const partnerId of otherPartnersOf(union, personId)) {
          leftWidth += PARTNER_GAP + CARD_WIDTH;
          visited.add(partnerId);
          leftWidth += measureExtraUnionsOwnGen(partnerId, union.id, visited);
        }
      }
    }

    const personX = x + leftWidth;
    placePerson(personId, personX, y);

    if (unions.length === 0) {
      return;
    }

    // Nur die erste Union rechts vom Anker — weitere über placeExtraUnions links.
    const first = unions[0];
    placedFamilies.add(first.id);

    const others = otherPartnersOf(first, personId);
    let cursorX = personX + CARD_WIDTH;
    const familyCenterX = cursorX + PARTNER_GAP / 2;
    const familyCenterY = y + CARD_HEIGHT / 2;

    addFamilyNode(first, familyCenterX, familyCenterY);
    addEdge(personId, first.familyNodeId);

    cursorX += PARTNER_GAP;

    for (const partnerId of others) {
      placePerson(partnerId, cursorX, y);
      addEdge(partnerId, first.familyNodeId);
      cursorX += CARD_WIDTH + PARTNER_GAP;
    }

    if (others.length === 0) {
      cursorX += PARTNER_GAP;
    }

    placeChildren(first, familyCenterX, y + GENERATION_GAP);

    for (const partnerId of others) {
      placeExtraUnions(partnerId, "right");
    }

    // Zweite und weitere Partnerschaften links am Anker (nicht hinter Partner 1).
    placeExtraUnions(personId, "left");
  }

  function extraUnionsOf(personId: string): Family[] {
    return (familiesByPartner.get(personId) ?? []).filter(
      (family) => !placedFamilies.has(family.id)
    );
  }

  function measureExtraUnions(
    personId: string,
    stack: Set<string>
  ): number {
    const unions = unionsOf(personId, stack).filter(
      (family) => !placedFamilies.has(family.id)
    );

    let width = 0;

    for (const union of unions) {
      const others = otherPartnersOf(union, personId);
      width += others.length * (PARTNER_GAP + CARD_WIDTH);

      stack.add(union.id);

      const kids = childIdsOf(union);
      let kidsWidth = 0;

      for (let index = 0; index < kids.length; index++) {
        if (index > 0) {
          kidsWidth += SIBLING_GAP;
        }

        kidsWidth += measurePersonSubtree(kids[index], stack);
      }

      stack.delete(union.id);
      width = Math.max(width, kidsWidth);
    }

    return width;
  }

  function placeExtraUnions(
    personId: string,
    direction: "left" | "right"
  ): void {
    const origin = personPositions.get(personId);

    if (!origin) {
      return;
    }

    const unions = extraUnionsOf(personId);

    if (unions.length === 0) {
      return;
    }

    const familyCenterY = origin.y + CARD_HEIGHT / 2;

    if (direction === "right") {
      let cursorX = origin.x + CARD_WIDTH;

      for (const union of unions) {
        placedFamilies.add(union.id);

        const others = otherPartnersOf(union, personId);
        const familyCenterX = cursorX + PARTNER_GAP / 2;

        addFamilyNode(union, familyCenterX, familyCenterY);
        addEdge(personId, union.familyNodeId);

        cursorX += PARTNER_GAP;

        for (const partnerId of others) {
          placePerson(partnerId, cursorX, origin.y);
          addEdge(partnerId, union.familyNodeId);
          cursorX += CARD_WIDTH + PARTNER_GAP;
        }

        placeChildren(union, familyCenterX, origin.y + GENERATION_GAP);

        for (const partnerId of others) {
          placeExtraUnions(partnerId, "right");
        }
      }

      return;
    }

    let rightEdge = origin.x;

    for (const union of unions) {
      placedFamilies.add(union.id);

      const others = otherPartnersOf(union, personId);
      const familyCenterX = rightEdge - PARTNER_GAP / 2;

      addFamilyNode(union, familyCenterX, familyCenterY);
      addEdge(personId, union.familyNodeId);

      for (const partnerId of others) {
        const partnerX = rightEdge - PARTNER_GAP - CARD_WIDTH;
        placePerson(partnerId, partnerX, origin.y);
        addEdge(partnerId, union.familyNodeId);
        rightEdge = partnerX;
      }

      placeChildren(union, familyCenterX, origin.y + GENERATION_GAP);

      for (const partnerId of others) {
        placeExtraUnions(partnerId, "left");
      }
    }
  }

  function placeFamily(family: Family, boxLeft: number, y: number): void {
    if (placedFamilies.has(family.id)) {
      return;
    }

    // Familie hängt schon an einer platzierten Person → außen anhängen, keine neue Reihe.
    const placedAnchor = family.partners.find((id) => placedPersons.has(id));
    if (placedAnchor && family.kind !== "sibling-group") {
      placeExtraUnions(placedAnchor, preferredExtraDirection(placedAnchor));
      return;
    }

    // Geschwistergruppe ohne Eltern: nebeneinander in einer Generation.
    if (
      family.kind === "sibling-group" ||
      (family.partners.length === 0 && family.children.length > 0)
    ) {
      placedFamilies.add(family.id);

      const kids = childIdsOf(family);
      if (kids.length === 0) {
        return;
      }

      const childWidths = kids.map((id) => measureOwnGenerationWidth(id));
      const offsets: number[] = [];
      let offset = 0;

      for (let index = 0; index < kids.length; index++) {
        offsets.push(offset);
        offset += childWidths[index] + SIBLING_GAP;
      }

      const totalWidth = offset - SIBLING_GAP;
      const blockLeft =
        boxLeft +
        Math.max(0, (measureFamily(family, new Set()) - totalWidth) / 2);
      const childCenterSum = offsets.reduce(
        (sum, childOffset, index) =>
          sum + childOffset + childWidths[index] / 2,
        0
      );
      const familyCenterX = blockLeft + childCenterSum / kids.length;
      // Sammelschiene knapp über den Karten; Knoten sitzt auf der Schiene.
      const familyCenterY = y - 36;

      addFamilyNode(family, familyCenterX, familyCenterY);

      const subtreeNodeIds: string[][] = [];

      for (let index = 0; index < kids.length; index++) {
        const childId = kids[index];
        const before = nodeIdsSnapshot();
        placePersonWithPartners(childId, blockLeft + offsets[index], y);
        addEdge(family.familyNodeId, childId);
        subtreeNodeIds.push(captureSubtree(before, childId));
      }

      resolveSiblingOverlaps(subtreeNodeIds);

      const packed = generationRowBounds(subtreeNodeIds.flat(), y);
      if (packed) {
        const packedCenter = (packed.left + packed.right) / 2;
        moveFamilyNodeTo(family.familyNodeId, packedCenter, familyCenterY);
      }

      return;
    }

    placedFamilies.add(family.id);

    const width = measureFamily(family, new Set());
    const partners = orderPartners(family.partners);
    const rowWidth = partnerRowWidth(partners.length);
    const extraStack = new Set<string>([family.id]);
    const extraLeft =
      partners.length > 0
        ? measureExtraUnions(partners[0], extraStack)
        : 0;
    const extraRight =
      partners.length > 1
        ? measureExtraUnions(
            partners[partners.length - 1],
            extraStack
          )
        : 0;

    const innerWidth = width - extraLeft - extraRight;
    const rowLeft = boxLeft + extraLeft + (innerWidth - rowWidth) / 2;

    let partnerX = rowLeft;

    for (const partnerId of partners) {
      placePerson(partnerId, partnerX, y);
      partnerX += CARD_WIDTH + PARTNER_GAP;
    }

    const familyCenterX =
      partners.length <= 1
        ? rowLeft + CARD_WIDTH / 2
        : rowLeft + rowWidth / 2;

    const familyCenterY =
      partners.length <= 1
        ? y + CARD_HEIGHT
        : y + CARD_HEIGHT / 2;

    addFamilyNode(family, familyCenterX, familyCenterY);

    for (const partnerId of partners) {
      if (graph.persons.has(partnerId)) {
        addEdge(partnerId, family.familyNodeId);
      }
    }

    const beforeChildren = nodeIdsSnapshot();
    placeChildren(family, familyCenterX, y + GENERATION_GAP);
    const mainChildIds = newNodeIdsSince(beforeChildren);

    if (partners.length > 0) {
      const beforeLeft = nodeIdsSnapshot();
      placeExtraUnions(partners[0], "left");
      const leftIds = newNodeIdsSince(beforeLeft);

      const beforeRight = nodeIdsSnapshot();
      placeExtraUnions(partners[partners.length - 1], "right");
      const rightIds = newNodeIdsSince(beforeRight);

      resolveSiblingOverlaps([leftIds, mainChildIds, rightIds]);
    }
  }

  function isRootFamily(family: Family): boolean {
    return family.partners.every(
      (partnerId) => !familyByChild.has(partnerId)
    );
  }

  const rootFamilies = [...graph.families.values()].filter(isRootFamily);

  let cursorX = START_X;

  const familiesToPlace =
    rootFamilies.length > 0
      ? rootFamilies
      : [...graph.families.values()];

  for (const family of familiesToPlace) {
    const width = measureFamily(family, new Set());
    placeFamily(family, cursorX, START_Y);
    cursorX += width + FAMILY_GAP;
  }

  for (const family of graph.families.values()) {
    if (placedFamilies.has(family.id)) {
      continue;
    }

    const placedPartner = family.partners.find((id) =>
      placedPersons.has(id)
    );

    if (placedPartner) {
      placeExtraUnions(placedPartner, preferredExtraDirection(placedPartner));
      continue;
    }

    const width = measureFamily(family, new Set());
    placeFamily(family, cursorX, START_Y);
    cursorX += width + FAMILY_GAP;
  }

  for (const personId of graph.persons.keys()) {
    if (placedPersons.has(personId)) {
      continue;
    }

    placePersonWithPartners(personId, cursorX, START_Y);
    cursorX += CARD_WIDTH + SIBLING_GAP;
  }

  return { nodes, edges };
}
