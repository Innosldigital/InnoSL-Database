import { NextResponse } from "next/server";
import { insertWithAudit, makeIslRef, nullIfBlank, requireUser } from "@/lib/entity-api";

export async function POST(req: Request) {
  const authResult = await requireUser();
  if (authResult.response) return authResult.response;

  const body = await req.json();
  if (!body?.org_id?.trim() || !body?.diag_date || !body?.tool_used) {
    return NextResponse.json({ error: "Organisation ID, date and tool are required" }, { status: 400 });
  }

  const payload = {
    isl_ref: makeIslRef("D"),
    org_id: body.org_id.trim(),
    diag_date: body.diag_date,
    tool_used: body.tool_used,
    assessor: nullIfBlank(body.assessor),
    overall_score: body.overall_score || null,
    strategic_score: body.strategic_score || null,
    process_score: body.process_score || null,
    support_score: body.support_score || null,
    lendability_score: body.lendability_score || null,
    tier: nullIfBlank(body.tier),
    gap_priority: nullIfBlank(body.gap_priority),
    ta_recommended: nullIfBlank(body.ta_recommended),
    woman_led_flag: Boolean(body.woman_led_flag),
    youth_led_flag: Boolean(body.youth_led_flag),
    notes: nullIfBlank(body.notes),
  };

  const result = await insertWithAudit("diagnostic", payload, authResult.userId!, "diag_id");
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, record: result.data });
}
