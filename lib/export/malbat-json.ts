import type { ExportFamilyPayload } from "./types";

export function buildMalbatJson(payload: ExportFamilyPayload): string {
  return JSON.stringify(
    {
      format: "malbat-family",
      version: 1,
      exportedAt: payload.exportedAt,
      family: payload.family,
      persons: payload.persons,
      relationships: payload.relationships,
    },
    null,
    2
  );
}
