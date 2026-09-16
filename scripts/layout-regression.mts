/**
 * Regression: Cousinen-Ehe + Kind darf nicht in Herkunftsgeschwister greifen;
 * Ehefrau steht neben dem Mann; keine Karten-Überlappung.
 */
import { buildTreeGraph } from "../lib/tree-engine/graph.ts";
import { buildTreeLayout } from "../lib/tree-engine/layout.ts";
import type { Person, Relationship } from "../lib/tree-engine/types.ts";

const CARD = 270;
const GAP = 40;

function person(
  id: string,
  first: string,
  gender: "male" | "female",
  birth_date: string | null = null
): Person {
  return {
    id,
    family_id: "f",
    first_name: first,
    last_name: "",
    gender,
    birth_date,
    birth_place: null,
    is_deceased: false,
    death_date: null,
    death_place: null,
    notes: null,
  };
}

function pos(
  layout: ReturnType<typeof buildTreeLayout>,
  id: string
): { x: number; y: number } {
  const node = layout.nodes.find((entry) => entry.id === id);
  if (!node) {
    throw new Error(`missing node ${id}`);
  }
  return node.position;
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function noOverlaps(layout: ReturnType<typeof buildTreeLayout>): void {
  const byY = new Map<number, { id: string; x: number }[]>();
  for (const node of layout.nodes) {
    if (node.type !== "person") continue;
    const y = Math.round(node.position.y);
    const row = byY.get(y) ?? [];
    row.push({ id: node.id, x: node.position.x });
    byY.set(y, row);
  }

  for (const [y, row] of byY) {
    row.sort((a, b) => a.x - b.x);
    for (let i = 1; i < row.length; i++) {
      const gap = row[i].x - (row[i - 1].x + CARD);
      assert(
        gap >= GAP - 0.5,
        `overlap at y=${y}: ${row[i - 1].id} / ${row[i].id} gap=${gap}`
      );
    }
  }
}

function contiguousIds(
  layout: ReturnType<typeof buildTreeLayout>,
  ids: string[]
): boolean {
  const positions = ids.map((id) => ({ id, ...pos(layout, id) }));
  const y = Math.round(positions[0].y);
  assert(
    positions.every((p) => Math.round(p.y) === y),
    "group not on same row"
  );

  const row = layout.nodes
    .filter(
      (n) => n.type === "person" && Math.round(n.position.y) === y
    )
    .map((n) => ({ id: n.id, x: n.position.x }))
    .sort((a, b) => a.x - b.x);

  const set = new Set(ids);
  const indices = row
    .map((entry, index) => (set.has(entry.id) ? index : -1))
    .filter((index) => index >= 0);

  return indices[indices.length - 1] - indices[0] + 1 === indices.length;
}

function wifeBesideHusband(
  layout: ReturnType<typeof buildTreeLayout>,
  husbandId: string,
  wifeId: string
): void {
  const h = pos(layout, husbandId);
  const w = pos(layout, wifeId);
  assert(Math.abs(h.y - w.y) < 1, `${wifeId} not same Y as ${husbandId}`);
  assert(
    Math.abs(w.x - (h.x + CARD + 56)) < 5,
    `${wifeId} not beside ${husbandId}: hx=${h.x} wx=${w.x}`
  );
}

/** Fall A: Mixeber = Generation von Sileman (wie Screenshot-Mischung). */
function scenarioUncleGeneration(): void {
  const persons = [
    person("root", "Root", "male"),
    person("mixeber", "Mixeber", "male", "1950"),
    person("mazin", "Mazin", "male", "1952"),
    person("sileman", "Sileman", "male", "1954"),
    person("perdenesin", "Perdenesin", "female", "1978"),
    person("mistefa", "Mistefa", "male", "1980"),
    person("gorgin", "Gorgin", "male", "1982"),
    person("gulistan", "Gulistan", "female", "1984"),
    person("kawa", "Kawa", "male", "2000"),
  ];

  const relationships: Relationship[] = [
    { person1_id: "root", person2_id: "mixeber", relationship_type: "father" },
    { person1_id: "root", person2_id: "mazin", relationship_type: "father" },
    { person1_id: "root", person2_id: "sileman", relationship_type: "father" },
    {
      person1_id: "sileman",
      person2_id: "perdenesin",
      relationship_type: "father",
    },
    {
      person1_id: "sileman",
      person2_id: "mistefa",
      relationship_type: "father",
    },
    { person1_id: "sileman", person2_id: "gorgin", relationship_type: "father" },
    {
      person1_id: "sileman",
      person2_id: "gulistan",
      relationship_type: "father",
    },
    {
      person1_id: "mixeber",
      person2_id: "perdenesin",
      relationship_type: "partner",
    },
    { person1_id: "mixeber", person2_id: "kawa", relationship_type: "father" },
    {
      person1_id: "perdenesin",
      person2_id: "kawa",
      relationship_type: "mother",
    },
  ];

  const layout = buildTreeLayout(buildTreeGraph(persons, relationships));
  wifeBesideHusband(layout, "mixeber", "perdenesin");
  noOverlaps(layout);

  const kawa = pos(layout, "kawa");
  const mistefa = pos(layout, "mistefa");
  if (Math.round(kawa.y) === Math.round(mistefa.y)) {
    assert(
      contiguousIds(layout, ["mistefa", "gorgin", "gulistan"]),
      "ahmad siblings not contiguous"
    );
    assert(
      contiguousIds(layout, ["kawa"]),
      "kawa block broken"
    );
    const ahmad = ["mistefa", "gorgin", "gulistan"].map((id) => pos(layout, id));
    const aLeft = Math.min(...ahmad.map((p) => p.x));
    const aRight = Math.max(...ahmad.map((p) => p.x + CARD));
    assert(
      kawa.x + CARD <= aLeft + 0.5 || kawa.x >= aRight - 0.5,
      `kawa interleaved in ahmad sibs: kawa=${kawa.x} a=[${aLeft},${aRight}]`
    );
  }

  console.log("OK scenarioUncleGeneration");
}

/** Fall B: klassische Cousinen (gleiche Generation). */
function scenarioCousins(): void {
  const persons = [
    person("root", "Root", "male"),
    person("bedran", "Bedran", "male", "1950"),
    person("sileman", "Sileman", "male", "1952"),
    person("mixeber", "Mixeber", "male", "1975"),
    person("mazin", "Mazin", "male", "1977"),
    person("perdenesin", "Perdenesin", "female", "1978"),
    person("mistefa", "Mistefa", "male", "1980"),
    person("kawa", "Kawa", "male", "2000"),
  ];

  const relationships: Relationship[] = [
    { person1_id: "root", person2_id: "bedran", relationship_type: "father" },
    { person1_id: "root", person2_id: "sileman", relationship_type: "father" },
    { person1_id: "bedran", person2_id: "mixeber", relationship_type: "father" },
    { person1_id: "bedran", person2_id: "mazin", relationship_type: "father" },
    {
      person1_id: "sileman",
      person2_id: "perdenesin",
      relationship_type: "father",
    },
    {
      person1_id: "sileman",
      person2_id: "mistefa",
      relationship_type: "father",
    },
    {
      person1_id: "mixeber",
      person2_id: "perdenesin",
      relationship_type: "partner",
    },
    { person1_id: "mixeber", person2_id: "kawa", relationship_type: "father" },
    {
      person1_id: "perdenesin",
      person2_id: "kawa",
      relationship_type: "mother",
    },
  ];

  const layout = buildTreeLayout(buildTreeGraph(persons, relationships));
  wifeBesideHusband(layout, "mixeber", "perdenesin");
  noOverlaps(layout);

  const kawaY = Math.round(pos(layout, "kawa").y);
  const mistefaY = Math.round(pos(layout, "mistefa").y);
  assert(kawaY !== mistefaY, "kawa should be generation below ahmad sibs");

  console.log("OK scenarioCousins");
}

/** Fall C: Jiyana/Keora — Frau wandert zum Mann in derselben Elterngeneration. */
function scenarioSameBranchCousins(): void {
  const persons = [
    person("root", "Root", "male"),
    person("ahmad", "Ahmad", "male", "1950"),
    person("uncle", "Uncle", "male", "1952"),
    person("keora", "Keora", "male", "1975"),
    person("alan", "Alan", "male", "1976"),
    person("jiyana", "Jiyana", "female", "1978"),
    person("armanc", "Armanc", "male", "1980"),
  ];

  const relationships: Relationship[] = [
    { person1_id: "root", person2_id: "ahmad", relationship_type: "father" },
    { person1_id: "root", person2_id: "uncle", relationship_type: "father" },
    { person1_id: "ahmad", person2_id: "keora", relationship_type: "father" },
    { person1_id: "ahmad", person2_id: "alan", relationship_type: "father" },
    { person1_id: "uncle", person2_id: "jiyana", relationship_type: "father" },
    { person1_id: "uncle", person2_id: "armanc", relationship_type: "father" },
    {
      person1_id: "keora",
      person2_id: "jiyana",
      relationship_type: "partner",
    },
  ];

  const layout = buildTreeLayout(buildTreeGraph(persons, relationships));
  wifeBesideHusband(layout, "keora", "jiyana");
  noOverlaps(layout);
  console.log("OK scenarioSameBranchCousins");
}

scenarioUncleGeneration();
scenarioCousins();
scenarioSameBranchCousins();
console.log("ALL LAYOUT REGRESSIONS PASSED");
