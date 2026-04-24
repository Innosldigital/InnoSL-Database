import { NextResponse } from "next/server";
import { insertWithAudit, makeIslRef, nullIfBlank, requireUser } from "@/lib/entity-api";

export async function POST(req: Request) {
  const authResult = await requireUser();
  if (authResult.response) return authResult.response;

  const body = await req.json();
  if (!body?.event_id?.trim() || !body?.person_id?.trim()) {
    return NextResponse.json({ error: "Event ID and person ID are required" }, { status: 400 });
  }

  const payload = {
    isl_ref: makeIslRef("PT"),
    event_id: body.event_id.trim(),
    person_id: body.person_id.trim(),
    org_id: nullIfBlank(body.org_id),
    category: nullIfBlank(body.category),
    pitch_stage: nullIfBlank(body.pitch_stage),
    score: body.score || null,
    rank: body.rank || null,
    winner_flag: Boolean(body.winner_flag),
    finalist_flag: Boolean(body.finalist_flag),
    prize_amount: body.prize_amount || null,
    prize_currency: nullIfBlank(body.prize_currency) || "USD",
    prize_type: nullIfBlank(body.prize_type),
    idea_description: nullIfBlank(body.idea_description),
    notes: nullIfBlank(body.notes),
  };

  const result = await insertWithAudit("pitch", payload, authResult.userId!, "pitch_id");
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, record: result.data });
}
