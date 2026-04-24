import { NextResponse }       from "next/server";
import { auth }               from "@clerk/nextjs/server";
import { createAdminClient }   from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── UUID detector ─────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUUID  = (v: string) => UUID_RE.test(v?.trim() ?? "");

// ── Resolve person ref → UUID ─────────────────────────────────
async function resolvePersonId(raw: string, db: SupabaseClient): Promise<string | null> {
  const v = raw?.trim(); if (!v) return null;
  if (isUUID(v)) return v;
  { const { data } = await db.from("person").select("person_id").eq("isl_ref", v).maybeSingle();
    if (data?.person_id) return data.person_id; }
  if (v.includes("@")) {
    const { data } = await db.from("person").select("person_id").eq("email_primary", v.toLowerCase()).maybeSingle();
    if (data?.person_id) return data.person_id;
  }
  { const { data } = await db.from("person").select("person_id").ilike("full_name", v).limit(1).maybeSingle();
    if (data?.person_id) return data.person_id; }
  return null;
}

// ── Resolve event ref → UUID ──────────────────────────────────
async function resolveEventId(raw: string, db: SupabaseClient): Promise<string | null> {
  const v = raw?.trim(); if (!v) return null;
  if (isUUID(v)) return v;
  { const { data } = await db.from("event").select("event_id").eq("isl_ref", v).maybeSingle();
    if (data?.event_id) return data.event_id; }
  { const { data } = await db.from("event").select("event_id").ilike("name", v).limit(1).maybeSingle();
    if (data?.event_id) return data.event_id; }
  { const { data } = await db.from("event").select("event_id").ilike("name", `%${v}%`).limit(1).maybeSingle();
    if (data?.event_id) return data.event_id; }
  return null;
}

// ── Resolve org ref → UUID ────────────────────────────────────
async function resolveOrgId(raw: string, db: SupabaseClient): Promise<string | null> {
  const v = raw?.trim(); if (!v) return null;
  if (isUUID(v)) return v;
  { const { data } = await db.from("organisation").select("org_id").eq("isl_ref", v).maybeSingle();
    if (data?.org_id) return data.org_id; }
  { const { data } = await db.from("organisation").select("org_id").ilike("name", v).limit(1).maybeSingle();
    if (data?.org_id) return data.org_id; }
  return null;
}

// ── Normalise a column name to lowercase no-separator form ────
const normCol = (c: string) => c.toLowerCase().replace(/[\s_\-]+/g, "");

// ── Auto-detect table from data columns ───────────────────────
// Works with both snake_case ("eso_type") and spaced ("ESO Type") headers.
function detectTableFromData(records: Record<string, unknown>[]): string {
  if (!records.length) return "person";
  const cols = Object.keys(records[0]).map(normCol);
  const has  = (k: string) => cols.some(c => c.includes(normCol(k)));
  if (has("role_at_event") || (has("person_id") && has("event_id") && has("attended"))) return "attendance";
  if (has("kpi_name") || has("baseline") || (has("target") && has("actual") && has("period"))) return "mel_report";
  if (has("eso_type") || has("trained_by_isl") || has("active_partner") || has("esoid")) return "eso_partner";
  if (has("diag_date") || has("tool_used") || has("lendability") || has("loan_purpose")) return "diagnostic";
  if (has("winner_flag") || has("pitch_stage") || has("first_female_flag")) return "pitch";
  if (has("grant_type") || has("disbursement_date") || has("amount_usd")) return "grant_capital";
  if (has("event_type") || has("edition_year") || (has("date_start") && has("venue"))) return "event";
  if (has("woman_led") || has("org_type") || has("reg_number") || has("founder")) return "organisation";
  return "person";
}

// ── Normalise raw CSV keys → DB snake_case keys ────────────────
// Converts "ESO Type" → "eso_type", "Trained by ISL" → "trained_by_isl" etc.
// so upserts work even when the CSV used human-readable column headers.
function normaliseKeys(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    const dbKey = k.trim().toLowerCase().replace(/[\s\-]+/g, "_").replace(/[^a-z0-9_]/g, "");
    out[dbKey] = v;
  }
  return out;
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  let { records, batch_id, staging_id, source_name, target_table } = body;

  const db = createAdminClient();

  // Load from staging when records not passed directly (queue-page approval)
  if ((!records || records.length === 0) && staging_id) {
    const { data: stg } = await db
      .from("staging_import")
      .select("raw_data, mapped_data, target_table, import_batch, source_name")
      .eq("staging_id", staging_id)
      .single();
    if (stg) {
      // Prefer mapped_data (already has DB column names); fall back to raw_data
      // with key normalisation to convert "ESO Type" → "eso_type" etc.
      if (stg.mapped_data?.length) {
        records = stg.mapped_data;
      } else {
        records = (stg.raw_data ?? []).map(normaliseKeys);
      }
      batch_id    = stg.import_batch ?? batch_id;
      source_name = stg.source_name  ?? source_name;
      if (!target_table || target_table === "pending") {
        target_table = stg.target_table ?? "pending";
      }
    }
  }

  // Resolve "pending" placeholder by inspecting the data columns
  if (!target_table || target_table === "pending") {
    target_table = detectTableFromData(records ?? []);
  }

  if (!records?.length) {
    return NextResponse.json({ error: "No records found in staging" }, { status: 400 });
  }

  const results = { inserted: 0, updated: 0, errors: [] as string[] };

  // ── Per-table upsert logic ────────────────────────────────────
  for (let record of records) {
    try {
      let error: any = null;

      switch (target_table) {

        case "attendance": {
          const pid = await resolvePersonId(String(record.person_id ?? ""), db);
          const eid = await resolveEventId(String(record.event_id   ?? ""), db);
          if (!pid) { results.errors.push(`Person not found: "${record.person_id}"`); continue; }
          if (!eid) { results.errors.push(`Event not found: "${record.event_id}"`);   continue; }
          ({ error } = await db.from("attendance").upsert(
            { ...record, person_id: pid, event_id: eid, import_batch: batch_id },
            { onConflict: "person_id,event_id,role_at_event", ignoreDuplicates: false }
          ));
          break;
        }

        case "event": {
          ({ error } = await db.from("event").upsert(
            { ...record },
            { onConflict: "isl_ref", ignoreDuplicates: false }
          ));
          break;
        }

        case "organisation": {
          // Resolve founder person_id if present
          if (record.founder_person_id && !isUUID(String(record.founder_person_id))) {
            const fpid = await resolvePersonId(String(record.founder_person_id), db);
            if (fpid) record = { ...record, founder_person_id: fpid };
            else delete (record as any).founder_person_id;
          }
          ({ error } = await db.from("organisation").upsert(
            { ...record },
            { onConflict: "isl_ref", ignoreDuplicates: false }
          ));
          break;
        }

        case "pitch": {
          const pid = record.person_id ? await resolvePersonId(String(record.person_id), db) : null;
          const eid = record.event_id  ? await resolveEventId(String(record.event_id),   db) : null;
          const oid = record.org_id    ? await resolveOrgId(String(record.org_id),        db) : null;
          ({ error } = await db.from("pitch").upsert(
            { ...record,
              ...(pid ? { person_id: pid } : {}),
              ...(eid ? { event_id:  eid } : {}),
              ...(oid ? { org_id:    oid } : {}),
            },
            { onConflict: "isl_ref", ignoreDuplicates: false }
          ));
          break;
        }

        case "diagnostic": {
          const oid = record.org_id ? await resolveOrgId(String(record.org_id), db) : null;
          ({ error } = await db.from("diagnostic").upsert(
            { ...record, ...(oid ? { org_id: oid } : {}) },
            { onConflict: "isl_ref", ignoreDuplicates: false }
          ));
          break;
        }

        case "grant_capital": {
          const pid = record.person_id ? await resolvePersonId(String(record.person_id), db) : null;
          const oid = record.org_id    ? await resolveOrgId(String(record.org_id),        db) : null;
          ({ error } = await db.from("grant_capital").upsert(
            { ...record,
              ...(pid ? { person_id: pid } : {}),
              ...(oid ? { org_id:    oid } : {}),
            },
            { onConflict: "isl_ref", ignoreDuplicates: false }
          ));
          break;
        }

        case "mel_report": {
          ({ error } = await db.from("mel_report").upsert(
            { ...record },
            { onConflict: "isl_ref", ignoreDuplicates: false }
          ));
          break;
        }

        case "eso_partner": {
          ({ error } = await db.from("eso_partner").upsert(
            { ...record },
            { onConflict: "name", ignoreDuplicates: false }
          ));
          break;
        }

        default: {
          // person
          ({ error } = await db.from("person").upsert(
            { ...record, import_status: "Approved", data_sources: [source_name] },
            { onConflict: "email_primary", ignoreDuplicates: false }
          ));
          break;
        }
      }

      if (error) results.errors.push(error.message);
      else results.inserted++;

    } catch (e: any) {
      results.errors.push(e.message);
    }
  }

  // Update staging record — always write the resolved target_table and mapped_data
  // so a future queue re-approval can use pre-mapped records directly.
  if (staging_id) {
    const patch: Record<string, unknown> = {
      import_status: results.inserted === 0 ? "Needs_review" : "Approved",
      target_table,
      reviewed_by:  userId,
      reviewed_at:  new Date().toISOString(),
    };
    if (records?.length) patch.mapped_data = records;
    await db.from("staging_import").update(patch).eq("staging_id", staging_id);
  }

  return NextResponse.json({ inserted: results.inserted, errors: results.errors, target_table });
}
