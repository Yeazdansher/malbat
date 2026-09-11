import ExcelJS from "exceljs";

import type { ExportFamilyPayload } from "./types";

export async function buildExcelBuffer(
  payload: ExportFamilyPayload
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MALBAT";
  workbook.created = new Date(payload.exportedAt);

  const meta = workbook.addWorksheet("Stammbaum");
  meta.addRow(["Name", payload.family.name]);
  meta.addRow(["Beschreibung", payload.family.description ?? ""]);
  meta.addRow(["Exportiert am", payload.exportedAt]);
  meta.addRow(["Format", "malbat-excel"]);
  meta.addRow(["Version", 1]);
  meta.getColumn(1).width = 18;
  meta.getColumn(2).width = 50;

  const personsSheet = workbook.addWorksheet("Personen");
  personsSheet.columns = [
    { header: "id", key: "id", width: 38 },
    { header: "first_name", key: "first_name", width: 18 },
    { header: "last_name", key: "last_name", width: 18 },
    { header: "gender", key: "gender", width: 12 },
    { header: "birth_date", key: "birth_date", width: 14 },
    { header: "birth_place", key: "birth_place", width: 20 },
    { header: "is_deceased", key: "is_deceased", width: 12 },
    { header: "death_date", key: "death_date", width: 14 },
    { header: "death_place", key: "death_place", width: 20 },
    { header: "notes", key: "notes", width: 40 },
  ];

  for (const person of payload.persons) {
    personsSheet.addRow({
      id: person.id,
      first_name: person.first_name,
      last_name: person.last_name,
      gender: person.gender,
      birth_date: person.birth_date ?? "",
      birth_place: person.birth_place ?? "",
      is_deceased: person.is_deceased ? "ja" : "nein",
      death_date: person.death_date ?? "",
      death_place: person.death_place ?? "",
      notes: person.notes ?? "",
    });
  }

  const relationshipsSheet = workbook.addWorksheet("Beziehungen");
  relationshipsSheet.columns = [
    { header: "id", key: "id", width: 38 },
    { header: "person1_id", key: "person1_id", width: 38 },
    { header: "person2_id", key: "person2_id", width: 38 },
    { header: "relationship_type", key: "relationship_type", width: 18 },
  ];

  for (const relationship of payload.relationships) {
    relationshipsSheet.addRow({
      id: relationship.id,
      person1_id: relationship.person1_id,
      person2_id: relationship.person2_id,
      relationship_type: relationship.relationship_type,
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
