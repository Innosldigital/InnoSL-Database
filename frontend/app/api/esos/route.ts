import { NextResponse } from "next/server";
import { insertWithAudit, nullIfBlank, requireUser } from "@/lib/entity-api";

export async function POST(req: Request) {
  const authResult = await requireUser();
  if (authResult.response) return authResult.response;

  const body = await req.json();
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "Partner name is required" }, { status: 400 });
  }

  const payload = {
    name: body.name.trim(),
    eso_type: nullIfBlank(body.eso_type),
    country: nullIfBlank(body.country) || "Sierra Leone",
    city: nullIfBlank(body.city),
    trained_by_isl: Boolean(body.trained_by_isl),
    training_date: nullIfBlank(body.training_date),
    funder: nullIfBlank(body.funder),
    contact_person: nullIfBlank(body.contact_person),
    website: nullIfBlank(body.website),
    notes: nullIfBlank(body.notes),
  };

  const result = await insertWithAudit("eso_partner", payload, authResult.userId!, "eso_id");
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, record: result.data });
}
