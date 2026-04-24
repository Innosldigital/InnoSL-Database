import { NextResponse }      from "next/server";
import { auth }              from "@clerk/nextjs/server";
import { createAdminClient }  from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── UUID v4 detector ──────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUUID  = (v: string) => UUID_RE.test(v?.trim() ?? "");

// ── Resolve person reference → real UUID ──────────────────────
// Accepts: UUID (passthrough) | isl_ref (ISL-P-xxxxx) | email | full_name
async function resolvePersonId(raw: string, supabase: SupabaseClient): Promise<string | null> {
  const v = raw?.trim();
  if (!v) return null;
  if (isUUID(v)) return v;

  // Try isl_ref
  { const { data } = await supabase.from("person").select("person_id").eq("isl_ref", v).maybeSingle();
    if (data?.person_id) return data.person_id; }

  // Try email
  if (v.includes("@")) {
    const { data } = await supabase.from("person").select("person_id").eq("email_primary", v.toLowerCase()).maybeSingle();
    if (data?.person_id) return data.person_id;
  }

  // Try full_name (exact, case-insensitive)
  { const { data } = await supabase.from("person").select("person_id").ilike("full_name", v).limit(1).maybeSingle();
    if (data?.person_id) return data.person_id; }

  return null;
}

// ── Resolve event reference → real UUID ──────────────────────
// Accepts: UUID | isl_ref (ISL-E-xxxxx) | event name substring
async function resolveEventId(raw: string, supabase: SupabaseClient): Promise<string | null> {
  const v = raw?.trim();
  if (!v) return null;
  if (isUUID(v)) return v;

  // Try isl_ref
  { const { data } = await supabase.from("event").select("event_id").eq("isl_ref", v).maybeSingle();
    if (data?.event_id) return data.event_id; }

  // Try exact name
  { const { data } = await supabase.from("event").select("event_id").ilike("name", v).limit(1).maybeSingle();
    if (data?.event_id) return data.event_id; }

  // Try name contains
  { const { data } = await supabase.from("event").select("event_id").ilike("name", `%${v}%`).limit(1).maybeSingle();
    if (data?.event_id) return data.event_id; }

  return null;
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { records, batch_id, staging_id, source_name, target_table = "person" } = await req.json();

  if (!records?.length) {
    return NextResponse.json({ error: "No records provided" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const results  = { inserted: 0, updated: 0, errors: [] as string[] };

  if (target_table === "attendance") {
    for (const record of records) {
      try {
        // Resolve person_id and event_id — accept UUIDs, isl_refs, emails, names
        const resolvedPersonId = await resolvePersonId(String(record.person_id ?? ""), supabase);
        const resolvedEventId  = await resolveEventId(String(record.event_id  ?? ""), supabase);

        if (!resolvedPersonId) {
          results.errors.push(`Cannot find person: "${record.person_id}" — no matching UUID, isl_ref, email or name`);
          continue;
        }
        if (!resolvedEventId) {
          results.errors.push(`Cannot find event: "${record.event_id}" — no matching UUID, isl_ref or name`);
          continue;
        }

        const row = {
          ...record,
          person_id:    resolvedPersonId,
          event_id:     resolvedEventId,
          import_batch: batch_id,
        };

        const { data, error } = await supabase
          .from("attendance")
          .upsert(row, { onConflict: "person_id,event_id,role_at_event", ignoreDuplicates: false })
          .select("attendance_id");

        if (error) {
          results.errors.push(error.message);
        } else {
          await supabase.from("audit_log").insert({
            table_name:   "attendance",
            record_id:    data?.[0]?.attendance_id,
            action:       "IMPORT_APPROVE",
            new_values:   row,
            performed_by: userId,
            import_batch: batch_id,
          });
          results.inserted++;
        }
      } catch (e: any) {
        results.errors.push(e.message);
      }
    }
  } else {
    // Person table — upsert on email
    for (const record of records) {
      try {
        const { data, error } = await supabase
          .from("person")
          .upsert(
            { ...record, import_status: "Approved", data_sources: [source_name] },
            { onConflict: "email_primary", ignoreDuplicates: false }
          )
          .select("person_id");

        if (error) {
          results.errors.push(error.message);
        } else {
          await supabase.from("audit_log").insert({
            table_name:   "person",
            record_id:    data?.[0]?.person_id,
            action:       "IMPORT_APPROVE",
            new_values:   record,
            performed_by: userId,
            import_batch: batch_id,
          });
          results.inserted++;
        }
      } catch (e: any) {
        results.errors.push(e.message);
      }
    }
  }

  // Update staging record
  if (staging_id) {
    await supabase
      .from("staging_import")
      .update({
        import_status: results.inserted === 0 ? "Needs_review" : "Approved",
        target_table:  target_table,
        mapped_data:   records,
        reviewed_by:   userId,
        reviewed_at:   new Date().toISOString(),
      })
      .eq("staging_id", staging_id);
  }

  return NextResponse.json(results);
}
