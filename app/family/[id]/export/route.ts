import { NextResponse } from "next/server";

import { buildExcelBuffer } from "@/lib/export/excel";
import { buildGedcom } from "@/lib/export/gedcom";
import { exportFilename, loadFamilyExportPayload } from "@/lib/export/load-family";
import { buildMalbatJson } from "@/lib/export/malbat-json";
import type { ExportFormat } from "@/lib/export/types";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseFormat(value: string | null): ExportFormat | null {
  if (value === "gedcom" || value === "json" || value === "xlsx") {
    return value;
  }
  return null;
}

export async function GET(request: Request, context: RouteContext) {
  const { id: familyId } = await context.params;
  const format = parseFormat(new URL(request.url).searchParams.get("format"));

  if (!format) {
    return NextResponse.json(
      { error: "Ungültiges Exportformat." },
      { status: 400 }
    );
  }

  try {
    const payload = await loadFamilyExportPayload(familyId);

    if (format === "gedcom") {
      const body = buildGedcom(payload);
      return new NextResponse(body, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${exportFilename(payload.family.name, "ged")}"`,
        },
      });
    }

    if (format === "json") {
      const body = buildMalbatJson(payload);
      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${exportFilename(payload.family.name, "json")}"`,
        },
      });
    }

    const buffer = await buildExcelBuffer(payload);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${exportFilename(payload.family.name, "xlsx")}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";

    if (message === "NOT_AUTHENTICATED") {
      return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
    }
    if (message === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Stammbaum nicht gefunden." },
        { status: 404 }
      );
    }

    console.error("family export:", error);
    return NextResponse.json(
      { error: "Export fehlgeschlagen." },
      { status: 500 }
    );
  }
}
