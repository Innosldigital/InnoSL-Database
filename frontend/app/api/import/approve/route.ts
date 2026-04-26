import { NextResponse }       from "next/server";
import { auth }               from "@clerk/nextjs/server";
import { createAdminClient }   from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUUID  = (v: string) => UUID_RE.test(v?.trim() ?? "");

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

async function resolveEventId(raw: string, db: SupabaseClient): Promise<string | null> {
  const v = raw?.trim(); if (!v) return null;
  if (isUUID(v)) return v;
  { const { data } = await db.from("event").select("event_id").eq("isl_ref", v).maybeSingle();
    if (data?.event_id) return data.event_id; }
  { const { data } = await db.from("event").select("event_id").ilike("name", `%${v}%`).limit(1).maybeSingle();
    if (data?.event_id) return data.event_id; }
  return null;
}

async function resolveOrgId(raw: string, db: SupabaseClient): Promise<string | null> {
  const v = raw?.trim(); if (!v) return null;
  if (isUUID(v)) return v;
  { const { data } = await db.from("organisation").select("org_id").eq("isl_ref", v).maybeSingle();
    if (data?.org_id) return data.org_id; }
  { const { data } = await db.from("organisation").select("org_id").ilike("name", v).limit(1).maybeSingle();
    if (data?.org_id) return data.org_id; }
  return null;
}

async function resolveCohortId(raw: string, db: SupabaseClient): Promise<string | null> {
  const v = raw?.trim(); if (!v) return null;
  if (isUUID(v)) return v;
  { const { data } = await db.from("cohort").select("cohort_id").eq("isl_ref", v).maybeSingle();
    if (data?.cohort_id) return data.cohort_id; }
  return null;
}

const normCol = (c: string) => c.toLowerCase().replace(/[\s_\-]+/g, "");

function detectTableFromData(records: Record<string, unknown>[]): string {
  if (!records.length) return "person";
  const cols = Object.keys(records[0]).map(normCol);
  const has  = (k: string) => cols.some(c => c.includes(normCol(k)));

  // cohort_member: cohort_id + any org reference, no programme_name
  if (has("cohortid") && (has("orgid") || has("orgname")) && !has("programmename")) return "cohort_member";

  // cohort: any cohort-distinctive column
  if (has("programmename") || has("totalstartups") || has("graduatedcount") ||
      has("esotrainedflag") || has("esotrained") || has("cohortnumber") ||
      has("jobscreated") && has("startdate")) return "cohort";

  // training_session: topic/session_type + any session indicator (including speaker_name, activity_type)
  if (has("satisfactionscore") || has("prescore") || has("postscore") ||
      ((has("topic") || has("sessiontype")) &&
       (has("facilitator") || has("sessiondate") || has("programmefunder") || has("totalattended") ||
        has("speakername") || has("activitytype")))) return "training_session";

  // vip_contact: contact_type + relationship indicator
  if (has("contacttype") && (has("relationshipowner") || has("lastengaged"))) return "vip_contact";

  // diagnostic: standard fields + ILO/TA evaluations + competitiveness scorecards
  if (
    has("diagdate") || has("toolused") || has("lendability") || has("loanpurpose") ||
    has("tabusiness") || has("tafinancial") || (has("tahr") && has("tamarketing")) ||
    (has("overallscore") && has("strategicscore")) ||
    (has("assessmentdate") && has("assessor"))
  ) return "diagnostic";

  // mel_report: KPI reports + aggregate survey data
  if (
    has("kpiname") || has("baseline") || (has("target") && has("actual") && has("period")) ||
    has("totalrespondents") || (has("programme") && has("year") && has("pctfemale"))
  ) return "mel_report";

  // eso_partner
  if (has("esotype") || has("trainedbyisl") || has("activepartner")) return "eso_partner";

  // attendance: person_id + event_id + attended/role
  if (has("roleat") || (has("personid") && has("eventid") && has("attended"))) return "attendance";

  // pitch
  if (has("winnerflag") || has("firstfemaleflag") || has("pitchstage")) return "pitch";

  // grant_capital
  if (has("granttype") || has("disbursementdate") || has("amountusd")) return "grant_capital";

  // event
  if (has("eventtype") || has("editionyear") || (has("datestart") && has("venue"))) return "event";

  // organisation (after diagnostic so ILO evals with is_woman_led don't mis-detect)
  if (has("orgtype") || has("founderp") || has("tradingname") ||
      (has("womanled") && !has("tabusiness") && !has("tafinancial"))) return "organisation";

  return "person";
}

function normaliseKeys(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    const dbKey = k.trim().toLowerCase().replace(/[\s\-]+/g, "_").replace(/[^a-z0-9_]/g, "");
    // Coerce empty strings to null so Postgres numeric/date columns don't reject them
    out[dbKey] = (typeof v === "string" && v.trim() === "") ? null : v;
  }
  return out;
}

function coerceEmptyToNull(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    out[k] = (typeof v === "string" && v.trim() === "") ? null : v;
  }
  return out;
}

// Columns allowed per table (prevents schema cache errors)
const ALLOWED: Record<string, Set<string>> = {
  person: new Set(["person_id","isl_ref","full_name","first_name","last_name","gender",
    "age_group","nationality","phone_primary","email_primary","location","district",
    "country","is_woman","is_youth","is_girl","is_aged","is_pwd","is_repeat_beneficiary",
    "first_engagement_date","first_programme","total_events_attended","total_programmes",
    "completeness_score","record_status","import_status","data_sources","created_at","updated_at"]),
  vip_contact: new Set(["contact_id","isl_ref","person_id","title","contact_type",
    "organisation","country","relationship_owner","events_attended","last_engaged","notes",
    "created_at","updated_at"]),
  organisation: new Set(["org_id","isl_ref","name","trading_name","sector","org_type",
    "registration_number","registration_date","city","district","country","active",
    "woman_led","youth_led","founder_person_id","website","email","phone",
    "employees","revenue_band","description","notes","created_at","updated_at"]),
  pitch: new Set(["pitch_id","isl_ref","event_id","person_id","org_id","application_code",
    "theme","category","idea_description","pitch_stage","score","rank","judge_ids",
    "winner_flag","finalist_flag","prize_amount","prize_currency","prize_type",
    "first_female_flag","first_time_flag","repeat_pitcher_flag","pitch_deck_link",
    "feedback_doc_link","notes","created_at","updated_at"]),
  diagnostic: new Set(["diag_id","isl_ref","org_id","assessor","assessor_person_id",
    "diag_date","tool_used","cohort_id","strategic_score","process_score","support_score",
    "overall_score","tier","market_expansion_score","production_score","financial_mgmt_score",
    "operations_score","social_impact_score","lendability_score","gap_priority",
    "ta_recommended","ta_delivered","follow_up_date","woman_led_flag","youth_led_flag",
    "scorecard_doc_link","raw_responses_link","notes","created_at"]),
  eso_partner: new Set(["eso_id","name","eso_type","country","city","focus_sectors",
    "trained_by_isl","training_date","active_partner","funder","contact_person",
    "contact_person_id","website","programmes_collab","notes","created_at"]),
  grant_capital: new Set(["grant_id","isl_ref","org_id","person_id","cohort_id","funder",
    "programme","grant_type","amount_local","amount_usd","currency","disbursement_date",
    "conditions","recipient_gender","recipient_youth","recipient_sector","woman_led_business",
    "milestone_1","milestone_2","milestone_3","outcome_jobs","outcome_revenue",
    "repayment_status","agreement_doc_link","mel_report_id","notes","created_at","updated_at"]),
  cohort: new Set(["cohort_id","isl_ref","programme_name","funder","cohort_number","year",
    "start_date","end_date","sector_focus","stage_focus","total_startups","female_led_count",
    "youth_led_count","regional_count","graduated_count","jobs_created","revenue_post",
    "eso_trained_flag","report_doc_link","drive_folder_link","notes","created_at"]),
  training_session: new Set(["training_id","event_id","programme_funder","session_type",
    "topic","facilitator","facilitator_person_id","session_date","duration_hours","format",
    "total_registered","total_attended","female_count","male_count","youth_count",
    "satisfaction_score","pre_score","post_score","report_doc_link","materials_link","notes","created_at"]),
  mel_report: new Set(["report_id","isl_ref","period","period_start","period_end",
    "programme","funder","report_type","kpi_name","baseline","target","actual","status",
    "female_beneficiaries","male_beneficiaries","youth_beneficiaries","aged_beneficiaries",
    "pwd_beneficiaries","regional_beneficiaries","jobs_created_female","jobs_created_male",
    "revenue_generated","satisfaction","report_doc_link","raw_data_link",
    "prepared_by","approved_by","notes","created_at"]),
};

const DIAG_EXTRA = new Set(["business_age","employees","revenue_band","loan_purpose",
  "has_business_plan","profitability","growth_sector","capacity_utilisation","has_qa_system",
  "has_sales_strategy","market_reach","financial_records","management_accounts","loan_history",
  "finance_separation","hr_policy","payroll_system","software_used","main_challenge",
  "ta_received","referral_source","contact","data_sources","outcome_status"]);

function sanitise(record: Record<string, unknown>, table: string): Record<string, unknown> {
  const allowed = ALLOWED[table];
  if (!allowed) return record;

  if (table === "diagnostic") {
    const extra: Record<string, unknown> = {};
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(record)) {
      if (DIAG_EXTRA.has(k)) extra[k] = v;
      else if (allowed.has(k)) clean[k] = v;
    }
    if (Object.keys(extra).length > 0) {
      const existing = String(clean.notes ?? "").trim();
      clean.notes = existing
        ? `${existing}\n\n${JSON.stringify(extra, null, 2)}`
        : JSON.stringify(extra, null, 2);
    }
    return clean;
  }

  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    if (allowed.has(k)) clean[k] = v;
  }
  return clean;
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  let { records, batch_id, staging_id, source_name, target_table } = body;
  const db = createAdminClient();

  if ((!records || records.length === 0) && staging_id) {
    const { data: stg } = await db.from("staging_import")
      .select("raw_data, mapped_data, target_table, import_batch, source_name")
      .eq("staging_id", staging_id).single();
    if (stg) {
      records     = stg.mapped_data?.length ? stg.mapped_data : (stg.raw_data ?? []).map(normaliseKeys);
      batch_id    = stg.import_batch ?? batch_id;
      source_name = stg.source_name  ?? source_name;
      // Always re-detect from actual data content — stored target_table may be stale from upload
      target_table = detectTableFromData(records);
    }
  }

  if (!target_table || target_table === "pending") {
    target_table = detectTableFromData(records ?? []);
  }

  if (!records?.length) {
    return NextResponse.json({ error: "No records found in staging" }, { status: 400 });
  }

  const results = { inserted: 0, errors: [] as string[], target_table };

  for (let record of records) {
    // Coerce empty strings to null for every record regardless of source —
    // prevents "invalid input syntax for type numeric/date" on empty CSV cells
    record = coerceEmptyToNull(record);

    try {
      let error: any = null;

      switch (target_table) {

        case "attendance": {
          const pid = await resolvePersonId(String(record.person_id ?? ""), db);
          const eid = await resolveEventId(String(record.event_id ?? ""), db);
          if (!pid) { results.errors.push(`Person not found: "${record.person_id}"`); continue; }
          if (!eid) { results.errors.push(`Event not found: "${record.event_id}"`); continue; }
          ({ error } = await db.from("attendance").upsert(
            { ...record, person_id: pid, event_id: eid, import_batch: batch_id },
            { onConflict: "person_id,event_id,role_at_event", ignoreDuplicates: false }
          ));
          break;
        }

        case "event": {
          ({ error } = await db.from("event").upsert(
            { ...record }, { onConflict: "isl_ref", ignoreDuplicates: false }
          ));
          break;
        }

        case "organisation": {
          if (record.founder_person_id && !isUUID(String(record.founder_person_id))) {
            const fpid = await resolvePersonId(String(record.founder_person_id), db);
            if (fpid) record = { ...record, founder_person_id: fpid };
            else delete (record as any).founder_person_id;
          }
          const orgRec = sanitise({ ...record }, "organisation");
          ({ error } = await db.from("organisation").upsert(
            orgRec, { onConflict: "isl_ref", ignoreDuplicates: false }
          ));
          break;
        }

        // ── PITCH ─────────────────────────────────────────────
        // Resolve ALL FKs first, THEN spread so UUIDs always win over ISL refs
        case "pitch": {
          const pid = record.person_id ? await resolvePersonId(String(record.person_id), db) : null;
          const eid = record.event_id  ? await resolveEventId(String(record.event_id),   db) : null;
          const oid = record.org_id    ? await resolveOrgId(String(record.org_id),        db) : null;

          if (!pid) { results.errors.push(`Pitch: person not found "${record.person_id}" — import persons first`); continue; }
          if (!eid) { results.errors.push(`Pitch: event not found "${record.event_id}" — import events first`);   continue; }

          const pitchRec = sanitise(
            { ...record, person_id: pid, event_id: eid, ...(oid ? { org_id: oid } : { org_id: null }) },
            "pitch"
          );

          if (pitchRec.isl_ref) {
            ({ error } = await db.from("pitch").upsert(pitchRec, { onConflict: "isl_ref", ignoreDuplicates: false }));
          } else {
            ({ error } = await db.from("pitch").insert(pitchRec));
          }
          break;
        }

        // ── DIAGNOSTIC ────────────────────────────────────────
        case "diagnostic": {
          // Alias common org identifier columns → org_id before resolution
          if (!record.org_id) {
            record = {
              ...record,
              org_id: record.business_name ?? record.company_name ?? record.organisation_name ?? record.org_name ?? null,
            };
          }

          let oid: string | null = record.org_id
            ? await resolveOrgId(String(record.org_id), db)
            : null;

          // org_id is NOT NULL — auto-create a stub org so the row can import now.
          // When the real org CSV is approved it upserts by isl_ref and fills details.
          if (!oid && record.org_id) {
            const ref = String(record.org_id).trim();
            if (!isUUID(ref)) {
              const { data: stub } = await db
                .from("organisation")
                .insert({ isl_ref: ref, name: ref, active: false })
                .select("org_id")
                .single();
              if (stub?.org_id) {
                oid = stub.org_id;
              } else {
                const { data: existing } = await db
                  .from("organisation").select("org_id").eq("isl_ref", ref).maybeSingle();
                oid = existing?.org_id ?? null;
              }
            }
          }

          // org_id is NOT NULL — cannot proceed without one
          if (!oid) {
            results.errors.push(
              `Diagnostic: org_id required — map 'business_name' or 'company_name' to org_id in the field mapper (got: "${record.org_id ?? ""}")`
            );
            continue;
          }

          // Alias common alternative date/tool column names before sanitise strips them
          if (record.assessment_date && !record.diag_date) record = { ...record, diag_date: record.assessment_date };
          if (record.evaluation_date && !record.diag_date) record = { ...record, diag_date: record.evaluation_date };
          if (record.date            && !record.diag_date) record = { ...record, diag_date: record.date };

          // Infer tool_used from column pattern (NOT NULL enum in schema)
          if (!record.tool_used) {
            const rKeys = Object.keys(record).map(k => k.toLowerCase());
            const hasLend  = rKeys.some(k => k.includes("lendability") || k.includes("loan_purpose"));
            const hasTA    = rKeys.some(k => k.startsWith("ta_"));
            const hasScore = rKeys.some(k => k.includes("strategic_score") || k.includes("competitiveness"));
            record = {
              ...record,
              tool_used: hasLend ? "Lendability_Index" : hasTA ? "ILO_Acceleration" : hasScore ? "ISL_Scorecard" : "Other",
            };
          }

          const diagRec = sanitise({ ...record, org_id: oid }, "diagnostic");

          // NOT NULL defaults
          if (!diagRec.diag_date) diagRec.diag_date = new Date().toISOString().split("T")[0];
          if (!diagRec.tool_used) diagRec.tool_used = "Other";

          // Coerce any text-in-numeric-field errors to null (e.g. "Average Competitiveness" in a score column)
          const DIAG_NUMERIC = ["strategic_score","process_score","support_score","overall_score",
            "market_expansion_score","production_score","financial_mgmt_score","operations_score",
            "social_impact_score","lendability_score"];
          for (const k of DIAG_NUMERIC) {
            if (diagRec[k] !== null && diagRec[k] !== undefined) {
              const v = Number(diagRec[k]);
              diagRec[k] = isNaN(v) ? null : v;
            }
          }

          if (diagRec.isl_ref) {
            ({ error } = await db.from("diagnostic").upsert(diagRec, { onConflict: "isl_ref", ignoreDuplicates: false }));
          } else {
            ({ error } = await db.from("diagnostic").insert(diagRec));
          }
          break;
        }

        // ── GRANT CAPITAL ─────────────────────────────────────
        case "grant_capital": {
          const pid = record.person_id ? await resolvePersonId(String(record.person_id), db) : null;
          const oid = record.org_id    ? await resolveOrgId(String(record.org_id),        db) : null;

          // Resolve funder from common alternative column names
          if (!record.funder) {
            record = {
              ...record,
              funder: record.donor ?? record.funding_agency ?? record.fund_source ??
                      record.grantor ?? record.funding_body ?? record.funder_name ??
                      record.grant_source ?? record.programme_funder ?? record.programme ?? null,
            };
          }

          const grantRec = sanitise(
            { ...record, ...(pid ? { person_id: pid } : { person_id: null }), ...(oid ? { org_id: oid } : { org_id: null }) },
            "grant_capital"
          );

          // Apply NOT NULL defaults for columns that may be missing from minimal CSVs.
          // User can correct these later via the UI or a re-import with full columns.
          if (!grantRec.funder     || String(grantRec.funder).trim()     === "") grantRec.funder     = "Unknown";
          if (!grantRec.grant_type || String(grantRec.grant_type).trim() === "") grantRec.grant_type = "Grant";
          if (!grantRec.currency   || String(grantRec.currency).trim()   === "") grantRec.currency   = "USD";

          if (grantRec.isl_ref) {
            ({ error } = await db.from("grant_capital").upsert(grantRec, { onConflict: "isl_ref", ignoreDuplicates: false }));
          } else {
            ({ error } = await db.from("grant_capital").insert(grantRec));
          }
          break;
        }

        // ── MEL REPORT ────────────────────────────────────────
        case "mel_report": {
          const melRec = sanitise({ ...record }, "mel_report");

          // period is NOT NULL — default to year column or "Unknown"
          if (!melRec.period) melRec.period = record.year ? String(record.year) : "Unknown";
          // programme is NOT NULL
          if (!melRec.programme) { results.errors.push("mel_report: programme is required"); continue; }

          if (melRec.isl_ref) {
            ({ error } = await db.from("mel_report").upsert(melRec, { onConflict: "isl_ref", ignoreDuplicates: false }));
          } else {
            ({ error } = await db.from("mel_report").insert(melRec));
          }
          break;
        }

        // ── ESO PARTNER ───────────────────────────────────────
        // eso_id in CSV is ISL-ESO-xxx (not a UUID) — drop it, use name-based lookup
        case "eso_partner": {
          const esoRec = sanitise({ ...record }, "eso_partner");
          // Remove eso_id if it's not a real UUID (it's our ISL reference code)
          if (esoRec.eso_id && !isUUID(String(esoRec.eso_id))) delete esoRec.eso_id;

          const name = String(esoRec.name ?? "").trim();
          if (!name) { results.errors.push("eso_partner: name is required"); continue; }

          const { data: existing } = await db.from("eso_partner")
            .select("eso_id").ilike("name", name).maybeSingle();

          if (existing?.eso_id) {
            ({ error } = await db.from("eso_partner").update(esoRec).eq("eso_id", existing.eso_id));
          } else {
            ({ error } = await db.from("eso_partner").insert(esoRec));
          }
          break;
        }

        // ── COHORT ────────────────────────────────────────────
        case "cohort": {
          const cohortRec = sanitise({ ...record }, "cohort");
          if (!cohortRec.programme_name) { results.errors.push("cohort: programme_name required"); continue; }

          if (cohortRec.isl_ref) {
            ({ error } = await db.from("cohort").upsert(cohortRec, { onConflict: "isl_ref", ignoreDuplicates: false }));
          } else {
            ({ error } = await db.from("cohort").insert(cohortRec));
          }
          break;
        }

        // ── COHORT MEMBER ─────────────────────────────────────
        case "cohort_member": {
          const cid = record.cohort_id ? await resolveCohortId(String(record.cohort_id), db) : null;
          let   oid = record.org_id    ? await resolveOrgId(String(record.org_id),        db) : null;
          const pid = record.person_id ? await resolvePersonId(String(record.person_id),  db) : null;

          if (!cid) { results.errors.push(`cohort_member: cohort not found "${record.cohort_id}" — import cohorts first`); continue; }

          // Auto-stub org if referenced by ISL ref but not yet imported
          if (!oid && record.org_id) {
            const ref = String(record.org_id).trim();
            if (!isUUID(ref)) {
              const { data: stub } = await db
                .from("organisation")
                .insert({ isl_ref: ref, name: ref, active: false })
                .select("org_id").single();
              if (stub?.org_id) { oid = stub.org_id; }
              else {
                const { data: ex } = await db.from("organisation")
                  .select("org_id").eq("isl_ref", ref).maybeSingle();
                oid = ex?.org_id ?? null;
              }
            }
          }
          if (!oid) { results.errors.push(`cohort_member: org not found "${record.org_id}" — import organisations first`); continue; }

          ({ error } = await db.from("cohort_member").upsert(
            { cohort_id: cid, org_id: oid, ...(pid ? { person_id: pid } : {}),
              graduated: record.graduated === "TRUE" || record.graduated === true },
            { onConflict: "cohort_id,org_id", ignoreDuplicates: false }
          ));
          break;
        }

        // ── TRAINING SESSION ──────────────────────────────────
        // training_session has no isl_ref column — dedup by topic + session_date
        case "training_session": {
          // Remap CSV alias columns → schema field names before sanitise
          if (record.speaker_name  && !record.facilitator)    record.facilitator    = record.speaker_name;
          if (record.date          && !record.session_date)   record.session_date   = record.date;
          if (record.activity_type && !record.session_type)   record.session_type   = record.activity_type;
          if (record.speaker_org   && !record.programme_funder) record.programme_funder = record.speaker_org;

          const eid = record.event_id ? await resolveEventId(String(record.event_id), db) : null;
          const trainRec = sanitise(
            { ...record, ...(eid ? { event_id: eid } : { event_id: null }) },
            "training_session"
          );

          if (!trainRec.topic) { results.errors.push("training_session: topic is required"); continue; }

          // Check for existing record by topic + session_date to avoid duplicates
          const topic     = String(trainRec.topic ?? "").trim();
          const sessDate  = trainRec.session_date ? String(trainRec.session_date) : null;
          let   existingId: string | null = null;

          if (topic && sessDate) {
            const { data: ex } = await db.from("training_session")
              .select("training_id")
              .eq("topic", topic)
              .eq("session_date", sessDate)
              .maybeSingle();
            existingId = ex?.training_id ?? null;
          }

          if (existingId) {
            ({ error } = await db.from("training_session").update(trainRec).eq("training_id", existingId));
          } else {
            ({ error } = await db.from("training_session").insert(trainRec));
          }
          break;
        }

        // ── VIP CONTACT ───────────────────────────────────────
        case "vip_contact": {
          const pid = record.person_id
            ? await resolvePersonId(String(record.person_id), db)
            : null;
          if (!pid) {
            results.errors.push(`vip_contact: person not found "${record.person_id}" — import persons first`);
            continue;
          }
          const vipRec = sanitise({ ...record, person_id: pid }, "vip_contact");

          if (vipRec.isl_ref) {
            ({ error } = await db.from("vip_contact").upsert(vipRec, { onConflict: "isl_ref", ignoreDuplicates: false }));
          } else {
            const { data: ex } = await db.from("vip_contact")
              .select("contact_id").eq("person_id", pid).maybeSingle();
            if (ex?.contact_id) {
              ({ error } = await db.from("vip_contact").update(vipRec).eq("contact_id", ex.contact_id));
            } else {
              ({ error } = await db.from("vip_contact").insert(vipRec));
            }
          }
          break;
        }

        // ── PERSON (default) ──────────────────────────────────
        default: {
          const personRec = sanitise(
            { ...record, import_status: "Approved", data_sources: [source_name] },
            "person"
          );
          // full_name is NOT NULL — give a clear error instead of a cryptic Supabase crash
          if (!personRec.full_name) {
            results.errors.push(
              `Person: full_name is required — this file may belong to a different table (detected as: ${target_table}). Reject this entry from the queue.`
            );
            continue;
          }
          // Use email_primary for dedup; fall back to isl_ref if no email
          const emailVal = String(personRec.email_primary ?? "").trim();
          if (emailVal && !emailVal.includes("placeholder")) {
            ({ error } = await db.from("person").upsert(
              personRec,
              { onConflict: "email_primary", ignoreDuplicates: false }
            ));
          } else {
            const islRef = String(personRec.isl_ref ?? "").trim();
            if (islRef) {
              const { data: ex } = await db.from("person").select("person_id")
                .eq("isl_ref", islRef).maybeSingle();
              if (ex?.person_id) {
                ({ error } = await db.from("person").update(personRec).eq("person_id", ex.person_id));
              } else {
                ({ error } = await db.from("person").insert(personRec));
              }
            } else {
              ({ error } = await db.from("person").insert(personRec));
            }
          }
          break;
        }
      }

      if (error) results.errors.push(error.message ?? String(error));
      else results.inserted++;

    } catch (e: any) {
      results.errors.push(e.message ?? String(e));
    }
  }

  if (staging_id) {
    await db.from("staging_import").update({
      import_status: results.inserted === 0 ? "Needs_review" : "Approved",
      target_table,
      reviewed_by:  userId,
      reviewed_at:  new Date().toISOString(),
      ...(records?.length ? { mapped_data: records } : {}),
    }).eq("staging_id", staging_id);
  }

  return NextResponse.json({ inserted: results.inserted, errors: results.errors, target_table });
}