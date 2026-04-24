import { NextResponse } from "next/server";
import { insertWithAudit, nullIfBlank, requireUser } from "@/lib/entity-api";

export async function POST(req: Request) {
  const authResult = await requireUser();
  if (authResult.response) return authResult.response;

  const body = await req.json();
  if (!body?.person_id?.trim() || !body?.contact_type) {
    return NextResponse.json({ error: "Person ID and contact type are required" }, { status: 400 });
  }

  const payload = {
    person_id: body.person_id.trim(),
    title: nullIfBlank(body.title),
    organisation: nullIfBlank(body.organisation),
    contact_type: body.contact_type,
    country: nullIfBlank(body.country),
    relationship_owner: nullIfBlank(body.relationship_owner),
    engagement_notes: nullIfBlank(body.engagement_notes),
    notes: nullIfBlank(body.notes),
  };

  const result = await insertWithAudit("vip_contact", payload, authResult.userId!, "contact_id");
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, record: result.data });
}
