import type { ExportFamilyPayload, ExportPerson } from "./types";

function escapeGedcomValue(value: string): string {
  return value.replace(/\r?\n/g, " ").trim();
}

function formatGedcomDate(date: string | null): string | null {
  if (!date) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const monthName = months[Number(month) - 1];
  if (!monthName) {
    return year;
  }

  return `${Number(day)} ${monthName} ${year}`;
}

function sexTag(gender: ExportPerson["gender"]): string {
  if (gender === "male") {
    return "M";
  }
  if (gender === "female") {
    return "F";
  }
  return "U";
}

/**
 * Minimaler GEDCOM 5.5.1-Export für Austausch mit Genealogie-Software.
 */
export function buildGedcom(payload: ExportFamilyPayload): string {
  const { family, persons, relationships } = payload;
  const idByPerson = new Map<string, string>();

  persons.forEach((person, index) => {
    idByPerson.set(person.id, `I${index + 1}`);
  });

  const lines: string[] = [
    "0 HEAD",
    "1 SOUR MALBAT",
    "2 NAME MALBAT",
    "2 VERS 1.0.0",
    "1 DEST ANY",
    "1 DATE " +
      (formatGedcomDate(payload.exportedAt.slice(0, 10)) ??
        payload.exportedAt.slice(0, 10)),
    "1 FILE " + escapeGedcomValue(family.name) + ".ged",
    "1 GEDC",
    "2 VERS 5.5.1",
    "2 FORM LINEAGE-LINKED",
    "1 CHAR UTF-8",
    `0 @FNOTE@ NOTE Stammbaum: ${escapeGedcomValue(family.name)}`,
  ];

  if (family.description) {
    lines.push(`1 CONT ${escapeGedcomValue(family.description)}`);
  }

  for (const person of persons) {
    const xref = idByPerson.get(person.id)!;
    lines.push(`0 @${xref}@ INDI`);
    lines.push(
      `1 NAME ${escapeGedcomValue(person.first_name)} /${escapeGedcomValue(person.last_name)}/`
    );
    lines.push(`2 GIVN ${escapeGedcomValue(person.first_name)}`);
    lines.push(`2 SURN ${escapeGedcomValue(person.last_name)}`);
    lines.push(`1 SEX ${sexTag(person.gender)}`);

    const birth = formatGedcomDate(person.birth_date);
    if (birth || person.birth_place) {
      lines.push("1 BIRT");
      if (birth) {
        lines.push(`2 DATE ${birth}`);
      }
      if (person.birth_place) {
        lines.push(`2 PLAC ${escapeGedcomValue(person.birth_place)}`);
      }
    }

    if (person.is_deceased || person.death_date || person.death_place) {
      lines.push("1 DEAT");
      const death = formatGedcomDate(person.death_date);
      if (death) {
        lines.push(`2 DATE ${death}`);
      }
      if (person.death_place) {
        lines.push(`2 PLAC ${escapeGedcomValue(person.death_place)}`);
      }
    }

    if (person.notes) {
      lines.push(`1 NOTE ${escapeGedcomValue(person.notes)}`);
    }
  }

  let familyIndex = 1;
  const coveredChildLinks = new Set<string>();

  function isParentType(type: string): boolean {
    return (
      type === "father" ||
      type === "mother" ||
      type === "parent" ||
      type === "adoptive-parent"
    );
  }

  for (const relation of relationships) {
    if (relation.relationship_type !== "partner") {
      continue;
    }

    const a = idByPerson.get(relation.person1_id);
    const b = idByPerson.get(relation.person2_id);
    if (!a || !b) {
      continue;
    }

    const personA = persons.find((p) => p.id === relation.person1_id);
    const personB = persons.find((p) => p.id === relation.person2_id);
    const husb =
      personA?.gender === "male"
        ? a
        : personB?.gender === "male"
          ? b
          : a;
    const wife = husb === a ? b : a;

    const famId = `F${familyIndex++}`;
    lines.push(`0 @${famId}@ FAM`);
    lines.push(`1 HUSB @${husb}@`);
    lines.push(`1 WIFE @${wife}@`);

    const parentIds = new Set([relation.person1_id, relation.person2_id]);
    const children = new Set<string>();

    for (const childRel of relationships) {
      if (
        isParentType(childRel.relationship_type) &&
        parentIds.has(childRel.person1_id)
      ) {
        const childXref = idByPerson.get(childRel.person2_id);
        if (childXref) {
          children.add(childXref);
          coveredChildLinks.add(`${childRel.person1_id}->${childRel.person2_id}`);
        }
      }
    }

    for (const childXref of children) {
      lines.push(`1 CHIL @${childXref}@`);
    }
  }

  for (const relation of relationships) {
    if (!isParentType(relation.relationship_type)) {
      continue;
    }

    const linkKey = `${relation.person1_id}->${relation.person2_id}`;
    if (coveredChildLinks.has(linkKey)) {
      continue;
    }

    const parentXref = idByPerson.get(relation.person1_id);
    const childXref = idByPerson.get(relation.person2_id);
    if (!parentXref || !childXref) {
      continue;
    }

    const famId = `F${familyIndex++}`;
    const parent = persons.find((p) => p.id === relation.person1_id);
    lines.push(`0 @${famId}@ FAM`);
    if (parent?.gender === "female") {
      lines.push(`1 WIFE @${parentXref}@`);
    } else {
      lines.push(`1 HUSB @${parentXref}@`);
    }
    lines.push(`1 CHIL @${childXref}@`);
    coveredChildLinks.add(linkKey);
  }

  lines.push("0 TRLR");
  return lines.join("\r\n") + "\r\n";
}
