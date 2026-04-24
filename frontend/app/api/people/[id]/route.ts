import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await req.json();
  if (!payload?.full_name?.trim()) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const update = {
    full_name: payload.full_name.trim(),
    preferred_name: payload.preferred_name?.trim() || null,
    gender: payload.gender,
    age_group: payload.age_group,
    nationality: payload.nationality?.trim() || null,
    email_primary: payload.email_primary?.trim() || null,
    email_secondary: payload.email_secondary?.trim() || null,
    phone_primary: payload.phone_primary?.trim() || null,
    phone_secondary: payload.phone_secondary?.trim() || null,
    location: payload.location?.trim() || null,
    district: payload.district?.trim() || null,
    region: payload.region?.trim() || null,
    nin: payload.nin?.trim() || null,
    notes: payload.notes?.trim() || null,
    record_status: payload.record_status,
    is_pwd: Boolean(payload.is_pwd),
  };

  const { data, error } = await supabase
    .from("person")
    .update(update)
    .eq("person_id", params.id)
    .select("person_id, full_name")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("audit_log").insert({
    table_name: "person",
    record_id: params.id,
    action: "UPDATE",
    new_values: update,
    performed_by: userId,
  });

  return NextResponse.json({ ok: true, person: data });
}
