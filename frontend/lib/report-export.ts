import Papa from "papaparse";
import { NextResponse } from "next/server";

export function csvResponse(filename: string, rows: unknown[]) {
  return new NextResponse(Papa.unparse(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
