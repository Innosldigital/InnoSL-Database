import { NextResponse } from "next/server";
import { insertWithAudit, makeIslRef, nullIfBlank, requireUser } from "@/lib/entity-api";

export async function POST(req: Request) {
  const authResult = await requireUser();
  if (authResult.response) return authResult.response;

  const body = await req.json();
  if (!body?.funder?.trim() || !body?.grant_type) {
    return NextResponse.json({ error: "Funder and grant type are required" }, { status: 400 });
  }

  const payload = {
    isl_ref: makeIslRef("G"),
    funder: body.funder.trim(),
    grant_type: body.grant_type,
    person_id: nullIfBlank(body.person_id),
    org_id: nullIfBlank(body.org_id),
    programme: nullIfBlank(body.programme),
    amount_usd: body.amount_usd || null,
    currency: nullIfBlank(body.currency) || "USD",
    disbursement_date: nullIfBlank(body.disbursement_date),
    repayment_status: nullIfBlank(body.repayment_status),
    notes: nullIfBlank(body.notes),
  };

  const result = await insertWithAudit("grant_capital", payload, authResult.userId!, "grant_id");
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, record: result.data });
}
