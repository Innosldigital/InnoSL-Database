import { NextResponse } from "next/server";
import { insertWithAudit, makeIslRef, nullIfBlank, requireUser } from "@/lib/entity-api";

export async function POST(req: Request) {
  const authResult = await requireUser();
  if (authResult.response) return authResult.response;

  const body = await req.json();
  if (!body?.programme_name?.trim()) {
    return NextResponse.json({ error: "Programme name is required" }, { status: 400 });
  }

  const payload = {
    isl_ref: makeIslRef("C"),
    programme_name: body.programme_name.trim(),
    funder: nullIfBlank(body.funder),
    cohort_number: body.cohort_number || null,
    year: body.year || null,
    start_date: nullIfBlank(body.start_date),
    end_date: nullIfBlank(body.end_date),
    sector_focus: nullIfBlank(body.sector_focus),
    stage_focus: nullIfBlank(body.stage_focus),
    notes: nullIfBlank(body.notes),
  };

  const result = await insertWithAudit("cohort", payload, authResult.userId!, "cohort_id");
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, record: result.data });
}
