import { NextResponse } from "next/server";
import { insertWithAudit, makeIslRef, nullIfBlank, requireUser } from "@/lib/entity-api";

export async function POST(req: Request) {
  const authResult = await requireUser();
  if (authResult.response) return authResult.response;

  const body = await req.json();
  if (!body?.full_name?.trim()) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }

  const payload = {
    isl_ref: makeIslRef("P"),
    full_name: body.full_name.trim(),
    preferred_name: nullIfBlank(body.preferred_name),
    gender: body.gender || "Unknown",
    age_group: body.age_group || "Unknown",
    nationality: nullIfBlank(body.nationality) || "Sierra Leonean",
    email_primary: nullIfBlank(body.email_primary),
    phone_primary: nullIfBlank(body.phone_primary),
    location: nullIfBlank(body.location),
    district: nullIfBlank(body.district),
    region: nullIfBlank(body.region),
    notes: nullIfBlank(body.notes),
    record_status: "Active",
  };

  const result = await insertWithAudit("person", payload, authResult.userId!, "person_id");
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, record: result.data });
}
