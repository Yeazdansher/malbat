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

const PARTNER_GAP = 120;
const SIBLING_GAP = 80;
const FAMILY_GAP = 180;
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
    return family.children.filter((id) => graph.persons.has(id));
  }

  function otherPartnersOf(family: Family, personId: string): string[] {
    return family.partners.filter(
      (id) => id !== personId && graph.persons.has(id)
    );
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

  function placeChildren(
    family: Family,
    familyCenterX: number,
    y: number
  ): void {
    const kids = childIdsOf(family);

    if (kids.length === 0) {
      return;
    }

    const stack = new Set<string>([family.id]);
    const childWidths = kids.map((id) => measurePersonSubtree(id, stack));

    const offsets: number[] = [];
    let offset = 0;

    for (let index = 0; index < kids.length; index++) {
      offsets.push(offset);
      offset += childWidths[index] + SIBLING_GAP;
    }

    const childCenterSum = offsets.reduce(
      (sum, childOffset) => sum + childOffset + CARD_WIDTH / 2,
      0
    );
    const childCenterAverage = childCenterSum / kids.length;
    const blockLeft = familyCenterX - childCenterAverage;

    for (let index = 0; index < kids.length; index++) {
      const childId = kids[index];
      placePersonWithPartners(childId, blockLeft + offsets[index], y);
      addEdge(family.familyNodeId, childId);
    }
  }

  function placePersonWithPartners(
    personId: string,
    x: number,
    y: number
  ): void {
    placePerson(personId, x, y);

    const unions = (familiesByPartner.get(personId) ?? []).filter(
      (family) => !placedFamilies.has(family.id)
    );

    let cursorX = x + CARD_WIDTH;

    for (const union of unions) {
      placedFamilies.add(union.id);

      const others = otherPartnersOf(union, personId);
      const familyCenterX = cursorX + PARTNER_GAP / 2;
      const familyCenterY = y + CARD_HEIGHT / 2;

      addFamilyNode(union, familyCenterX, familyCenterY);
      addEdge(personId, union.familyNodeId);

      cursorX += PARTNER_GAP;

      for (const partnerId of others) {
        placePerson(partnerId, cursorX, y);
        addEdge(partnerId, union.familyNodeId);
        cursorX += CARD_WIDTH + PARTNER_GAP;
      }

      if (others.length === 0) {
        cursorX += PARTNER_GAP;
      }

      placeChildren(union, familyCenterX, y + GENERATION_GAP);

      for (const partnerId of others) {
        placeExtraUnions(partnerId, "right");
      }
    }
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

    placeChildren(family, familyCenterX, y + GENERATION_GAP);

    if (partners.length > 0) {
      placeExtraUnions(partners[0], "left");
      placeExtraUnions(partners[partners.length - 1], "right");
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
      placeExtraUnions(placedPartner, "right");
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
