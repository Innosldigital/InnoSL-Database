import { NextResponse } from "next/server";
import { insertWithAudit, makeIslRef, nullIfBlank, requireUser } from "@/lib/entity-api";

export async function POST(req: Request) {
  const authResult = await requireUser();
  if (authResult.response) return authResult.response;

  const body = await req.json();
  if (!body?.name?.trim() || !body?.event_type) {
    return NextResponse.json({ error: "Event name and event type are required" }, { status: 400 });
  }

  const payload = {
    isl_ref: makeIslRef("E"),
    name: body.name.trim(),
    event_type: body.event_type,
    programme: nullIfBlank(body.programme),
    edition_year: body.edition_year || null,
    theme: nullIfBlank(body.theme),
    date_start: nullIfBlank(body.date_start),
    date_end: nullIfBlank(body.date_end),
    venue: nullIfBlank(body.venue),
    city: nullIfBlank(body.city) || "Freetown",
    funder: nullIfBlank(body.funder),
    notes: nullIfBlank(body.notes),
  };

  const result = await insertWithAudit("event", payload, authResult.userId!, "event_id");
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, record: result.data });
}
