import { NextResponse }      from "next/server";
import { auth }              from "@clerk/nextjs/server";
import { createAdminClient }  from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUUID  = (v: string) => UUID_RE.test(v?.trim() ?? "");

async function resolvePersonId(raw: string, supabase: SupabaseClient): Promise<string | null> {
  const v = raw?.trim();
  if (!v) return null;
  if (isUUID(v)) return v;
  { const { data } = await supabase.from("person").select("person_id").eq("isl_ref", v).maybeSingle();
    if (data?.person_id) return data.person_id; }
  if (v.includes("@")) {
    const { data } = await supabase.from("person").select("person_id").eq("email_primary", v.toLowerCase()).maybeSingle();
    if (data?.person_id) return data.person_id;
  }
  { const { data } = await supabase.from("person").select("person_id").ilike("full_name", v).limit(1).maybeSingle();
    if (data?.person_id) return data.person_id; }
  return null;
}

async function resolveEventId(raw: string, supabase: SupabaseClient): Promise<string | null> {
  const v = raw?.trim();
  if (!v) return null;
  if (isUUID(v)) return v;
  { const { data } = await supabase.from("event").select("event_id").eq("isl_ref", v).maybeSingle();
    if (data?.event_id) return data.event_id; }
  { const { data } = await supabase.from("event").select("event_id").ilike("name", v).limit(1).maybeSingle();
    if (data?.event_id) return data.event_id; }
  { const { data } = await supabase.from("event").select("event_id").ilike("name", `%${v}%`).limit(1).maybeSingle();
    if (data?.event_id) return data.event_id; }
  return null;
}

// GET — fetch one staging record
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("staging_import")
    .select("*")
    .eq("staging_id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// POST — approve or reject
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { action } = await req.json();

  const supabase = createAdminClient();

  const { data: staging, error: fetchErr } = await supabase
    .from("staging_import")
    .select("*")
    .eq("staging_id", params.id)
    .single();

  if (fetchErr || !staging) {
    return NextResponse.json({ error: "Staging record not found" }, { status: 404 });
  }

  if (action === "reject") {
    await supabase.from("staging_import").update({
      import_status: "Rejected",
      reviewed_by:   userId,
      reviewed_at:   new Date().toISOString(),
    }).eq("staging_id", params.id);
    return NextResponse.json({ ok: true, action: "rejected" });
  }

  const records: Record<string, unknown>[] = staging.mapped_data ?? staging.raw_data ?? [];
  const targetTable: string = staging.target_table ?? "person";
  const batchId: string     = staging.import_batch;
  const results = { inserted: 0, updated: 0, errors: [] as string[] };

  for (const record of records) {
    try {
      if (targetTable === "attendance") {
        const resolvedPersonId = await resolvePersonId(String(record.person_id ?? ""), supabase);
        const resolvedEventId  = await resolveEventId(String(record.event_id  ?? ""), supabase);

        if (!resolvedPersonId) {
          results.errors.push(`Person not found: "${record.person_id}"`);
          continue;
        }
        if (!resolvedEventId) {
          results.errors.push(`Event not found: "${record.event_id}"`);
          continue;
        }

        const row = { ...record, person_id: resolvedPersonId, event_id: resolvedEventId, import_batch: batchId };
        const { error } = await supabase
          .from("attendance")
          .upsert(row, { onConflict: "person_id,event_id,role_at_event", ignoreDuplicates: false });
        if (error) results.errors.push(error.message);
        else results.inserted++;
      } else {
        const { error } = await supabase
          .from("person")
          .upsert(
            { ...record, import_status: "Approved", data_sources: [staging.source_name] },
            { onConflict: "email_primary", ignoreDuplicates: false }
          );
        if (error) results.errors.push(error.message);
        else results.inserted++;
      }
    } catch (e: any) {
      results.errors.push(e.message);
    }
  }

  const finalStatus = results.inserted === 0 ? "Needs_review" : "Approved";

  await supabase.from("staging_import").update({
    import_status: finalStatus,
    target_table:  targetTable,
    reviewed_by:   userId,
    reviewed_at:   new Date().toISOString(),
  }).eq("staging_id", params.id);

  return NextResponse.json({ ...results, status: finalStatus });
}
