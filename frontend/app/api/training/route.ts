import { NextResponse } from "next/server";
import { insertWithAudit, nullIfBlank, requireUser } from "@/lib/entity-api";

export async function POST(req: Request) {
  const authResult = await requireUser();
  if (authResult.response) return authResult.response;

  const body = await req.json();
  if (!body?.topic?.trim()) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  const payload = {
    event_id: nullIfBlank(body.event_id),
    programme_funder: nullIfBlank(body.programme_funder),
    session_type: nullIfBlank(body.session_type),
    topic: body.topic.trim(),
    facilitator: nullIfBlank(body.facilitator),
    session_date: nullIfBlank(body.session_date),
    duration_hours: body.duration_hours || null,
    format: nullIfBlank(body.format) || "In-person",
    notes: nullIfBlank(body.notes),
  };

  const result = await insertWithAudit("training_session", payload, authResult.userId!, "training_id");
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, record: result.data });
}
