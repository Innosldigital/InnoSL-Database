"use client";
import { useState, useMemo } from "react";
import { toast } from "sonner";

// ── All schema fields grouped by target table ─────────────────
const TABLE_FIELDS: Record<string, string[]> = {
  person: [
    "isl_ref","full_name","preferred_name","gender","date_of_birth","age_group","age_raw",
    "nationality","nin","phone_primary","phone_secondary","email_primary","email_secondary",
    "location","district","region","is_woman","is_girl","is_youth","is_aged","is_pwd",
    "is_repeat_beneficiary","is_outside_freetown","first_engagement_date","first_programme",
    "record_status","import_status","data_sources","notes",
  ],
  organisation: [
    "org_id","isl_ref","name","sector","sub_sector","stage","org_type","reg_number",
    "founded_date","location","district","website","description","founder_person_id",
    "woman_led","youth_led","diaspora_led","active","data_sources",
  ],
  event: [
    "isl_ref","name","event_type","programme","edition_year","edition_number","theme",
    "date_start","date_end","venue","city","funder","partner_organisations",
    "total_registered","total_attended","female_count","male_count","youth_count",
    "report_doc_link","drive_folder_link","notes","data_sources",
  ],
  attendance: [
    "person_id","event_id","role_at_event","registered","attended",
    "day_number","source_form","import_batch","notes",
  ],
  pitch: [
    "isl_ref","event_id","person_id","org_id","application_code","theme","category",
    "idea_description","pitch_stage","score","rank","winner_flag","finalist_flag",
    "prize_amount","prize_currency","prize_type","first_female_flag","first_time_flag",
    "repeat_pitcher_flag","pitch_deck_link","feedback_doc_link","notes","data_sources",
  ],
  diagnostic: [
    "isl_ref","org_id","contact","assessor","diag_date","tool_used","sector",
    "business_age","employees","revenue_band","loan_purpose","has_business_plan",
    "profitability","growth_sector","capacity_utilisation","has_qa_system",
    "has_sales_strategy","market_reach","financial_records","management_accounts",
    "loan_history","finance_separation","hr_policy","payroll_system","software_used",
    "main_challenge","ta_received","woman_led_flag","youth_led_flag","referral_source",
    "strategic_score","process_score","support_score","overall_score","tier",
    "lendability_score","gap_priority","scorecard_doc_link","data_sources",
  ],
  eso_partner: [
    "eso_id","name","eso_type","country","city","focus_sectors",
    "trained_by_isl","training_date","active_partner","funder",
    "contact_person","website","programmes_collab","data_sources",
  ],
  training_session: [
    "isl_ref","event_id","programme_funder","session_type","topic","facilitator",
    "facilitator_person_id","session_date","duration_hours","format",
    "total_registered","total_attended","female_count","male_count","youth_count",
    "satisfaction_score","data_sources",
  ],
  mel_report: [
    "isl_ref","period","period_start","period_end","programme","funder","report_type",
    "kpi_name","baseline","target","actual","status",
    "female_beneficiaries","male_beneficiaries","youth_beneficiaries",
    "aged_beneficiaries","pwd_beneficiaries","regional_beneficiaries",
    "jobs_created_female","jobs_created_male","revenue_generated","satisfaction",
    "report_doc_link","prepared_by","approved_by","data_sources",
  ],
};

const TABLE_LABELS: Record<string, string> = {
  person: "Person", organisation: "Organisation", event: "Event",
  attendance: "Attendance", pitch: "Pitch", diagnostic: "Diagnostic",
  eso_partner: "ESO Partner", training_session: "Training Session", mel_report: "M&E Report",
};

const REQUIRED_PER_TABLE: Record<string, string[]> = {
  person: ["full_name"],
  organisation: ["name"],
  event: ["name"],
  attendance: ["person_id", "event_id"],
  pitch: ["event_id", "person_id"],
  diagnostic: ["org_id"],
  eso_partner: ["name"],
  training_session: ["topic"],
  mel_report: ["programme"],
};

// ── REPLACE the detectTable function in FieldMapper.tsx with this version ──
// This adds cohort, cohort_member, and training_session detection

function detectTable(cols: string[]): string {
  const c = cols.map((x) => x.toLowerCase().replace(/[\s_\-]+/g, ""));
  const has = (k: string) => c.some((col) => col.includes(k.toLowerCase().replace(/[\s_\-]+/g, "")));

  // cohort_member: has cohort_id AND org_id AND graduated (no programme_name)
  if (has("cohortid") && has("orgid") && has("graduated") && !has("programmename")) return "cohort_member";

  // cohort: has programme_name (unique to cohort table)
  if (has("programmename") || (has("totalstartups") && has("featureledcount"))) return "cohort";

  // training_session: topic + speaker/facilitator/activity signals
  if (has("topic") && (has("facilitator") || has("sessiontype") || has("sessiondate") || has("speakername") || has("activitytype"))) return "training_session";

  // attendance: has role_at_event OR person_id+event_id+attended
  if (has("roleat") || (has("personid") && has("eventid") && has("attended"))) return "attendance";

  // diagnostic: standard fields, ILO/TA evaluations, competitiveness scorecards
  if (
    has("diagdate") || has("toolused") || has("lendability") || has("loanpurpose") || has("tare") ||
    has("tabusiness") || has("tafinancial") || (has("tahr") && has("tamarketing")) ||
    (has("overallscore") && has("strategicscore")) ||
    (has("assessmentdate") && has("assessor"))
  ) return "diagnostic";

  // mel_report: KPI reports AND aggregate survey data
  if (
    has("kpiname") || has("baseline") || (has("target") && has("actual") && has("period")) ||
    has("totalrespondents") || (has("programme") && has("year") && has("pctfemale"))
  ) return "mel_report";

  // pitch
  if (has("winnerflag") || has("firstfemaleflag") || has("pitchstage") || has("repeatpitcher")) return "pitch";

  // grant_capital
  if (has("granttype") || has("disbursement") || has("amountusd")) return "grant_capital";

  // eso_partner
  if (has("esotype") || has("trainedbyisl") || has("activepartner")) return "eso_partner";

  // event
  if (has("eventtype") || has("editionyear") || (has("datestart") && has("venue"))) return "event";

  // organisation (after diagnostic so ILO evals with is_woman_led don't mis-detect)
  if (has("orgtype") || has("founder") || (has("womanled") && !has("tabusiness") && !has("tafinancial"))) return "organisation";

  return "person";
}

function autoMap(src: string, table: string): string {
  const s = src.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const fields = TABLE_FIELDS[table] ?? TABLE_FIELDS.person;
  if (fields.includes(src)) return src;

  if (table === "attendance") {
    if (s === "personid" || s === "person_id") return "person_id";
    if (s === "eventid" || s === "event_id") return "event_id";
    if (s.includes("role")) return "role_at_event";
    if (s.includes("register")) return "registered";
    if (s === "attended" || s === "attend") return "attended";
    if (s.includes("day")) return "day_number";
    if (s.includes("source") || s.includes("form")) return "source_form";
    if (s.includes("batch")) return "import_batch";
    return "(ignore)";
  }
  if (table === "diagnostic") {
    if (s === "orgid" || s === "org_id") return "org_id";
    if (s === "islref" || s === "isl_ref") return "isl_ref";
    if (s.includes("diagdate") || s === "date") return "diag_date";
    if (s.includes("tool")) return "tool_used";
    if (s.includes("sector")) return "sector";
    if (s.includes("businessage") || s === "business_age") return "business_age";
    if (s.includes("employ")) return "employees";
    if (s.includes("revenueband") || s === "revenue_band") return "revenue_band";
    if (s.includes("loanpurpose") || s === "loan_purpose") return "loan_purpose";
    if (s.includes("plan")) return "has_business_plan";
    if (s.includes("profit")) return "profitability";
    if (s.includes("growth")) return "growth_sector";
    if (s.includes("capacity")) return "capacity_utilisation";
    if (s.includes("qa") || (s.includes("quality") && s.includes("sys"))) return "has_qa_system";
    if (s.includes("sales") && s.includes("strat")) return "has_sales_strategy";
    if (s.includes("marketreach") || s === "market_reach") return "market_reach";
    if (s.includes("financialrec")) return "financial_records";
    if (s.includes("mgmtacc") || s.includes("managementacc")) return "management_accounts";
    if (s.includes("loanhistory") || s === "loan_history") return "loan_history";
    if (s.includes("financesep")) return "finance_separation";
    if (s.includes("hrpolicy") || s === "hr_policy") return "hr_policy";
    if (s.includes("payroll")) return "payroll_system";
    if (s.includes("software")) return "software_used";
    if (s.includes("challenge")) return "main_challenge";
    if (s.includes("tareceived") || s === "ta_received") return "ta_received";
    if (s.includes("womanled") || s === "woman_led_flag") return "woman_led_flag";
    if (s.includes("youthled") || s === "youth_led_flag") return "youth_led_flag";
    if (s.includes("referral")) return "referral_source";
    if (s.includes("lendability")) return "lendability_score";
    if (s.includes("strategic")) return "strategic_score";
    if (s.includes("processcore") || s === "process_score") return "process_score";
    if (s.includes("supportscore") || s === "support_score") return "support_score";
    if (s.includes("overall")) return "overall_score";
    if (s.includes("tier")) return "tier";
    if (s.includes("datasource") || s === "data_sources") return "data_sources";
    if (s.includes("contact")) return "contact";
    // Assessment/scorecard specific
    if (s === "ref" || s === "business_ref" || s === "assessment_ref" || s.includes("businessref") || s.includes("assessmentref")) return "isl_ref";
    if (s === "assessment_date" || s.includes("assessmentdate") || s.includes("assessdate")) return "diag_date";
    if (s === "business_name" || s.includes("businessname") || s === "company_name") return "org_id";
    if (s === "ceo_name" || s.includes("ceoname")) return "contact";
    if (s.includes("assessor") && !s.includes("person")) return "assessor";
    if ((s.startsWith("ta_") || s.startsWith("ta")) && s.length > 3 && !s.includes("target")) return "ta_received";
    if (s === "is_woman_led" || s.includes("iswomanled")) return "woman_led_flag";
    if (s === "key_gaps" || s.includes("keygap") || s.includes("recommendation")) return "gap_priority";
    if (s === "overall_rating" || s.includes("overallrating")) return "tier";
    return "(ignore)";
  }
  if (table === "training_session") {
    if (s === "islref" || s === "isl_ref") return "isl_ref";
    if (s === "eventid" || s === "event_id") return "event_id";
    if (s === "topic") return "topic";
    if (s.includes("facilitator") || s === "speaker_name" || s.includes("speakername")) return "facilitator";
    if (s === "session_date" || s.includes("sessiondate") || s === "date") return "session_date";
    if (s === "session_type" || s === "activity_type" || s.includes("sessiontype") || s.includes("activitytype")) return "session_type";
    if (s.includes("format")) return "format";
    if (s.includes("duration")) return "duration_hours";
    if (s.includes("funder")) return "programme_funder";
    if (s.includes("totalreg") || s === "total_registered") return "total_registered";
    if (s.includes("totalatt") || s === "total_attended") return "total_attended";
    if (s.includes("femalecount") || s === "female_count") return "female_count";
    if (s.includes("malecount") || s === "male_count") return "male_count";
    if (s.includes("satisfaction")) return "satisfaction_score";
    if (s.includes("datasource") || s === "data_sources") return "data_sources";
    return "(ignore)";
  }
  if (table === "mel_report") {
    if (s === "islref" || s === "isl_ref") return "isl_ref";
    if (s.includes("periodstart")) return "period_start";
    if (s.includes("periodend")) return "period_end";
    if (s === "period") return "period";
    if (s.includes("programme")) return "programme";
    if (s.includes("funder")) return "funder";
    if (s.includes("reporttype")) return "report_type";
    if (s.includes("kpi")) return "kpi_name";
    if (s.includes("baseline")) return "baseline";
    if (s.includes("target")) return "target";
    if (s.includes("actual")) return "actual";
    if (s.includes("status")) return "status";
    if (s.includes("female") && s.includes("ben")) return "female_beneficiaries";
    if (s.includes("male") && s.includes("ben")) return "male_beneficiaries";
    if (s.includes("youth") && s.includes("ben")) return "youth_beneficiaries";
    if (s.includes("jobs") && s.includes("female")) return "jobs_created_female";
    if (s.includes("jobs") && s.includes("male")) return "jobs_created_male";
    if (s.includes("satisfaction")) return "satisfaction";
    if (s.includes("prepared")) return "prepared_by";
    if (s.includes("datasource") || s === "data_sources") return "data_sources";
    if (s.includes("evidence")) return "data_sources";
    if (s === "reporting_period" || s.includes("reportingperiod")) return "period";
    if (s === "year") return "period";
    if (s === "metric_ref" || s === "survey_ref" || s.includes("metricref") || s.includes("surveyref")) return "isl_ref";
    if (s === "ref") return "isl_ref";
    return "(ignore)";
  }
  if (table === "event") {
    if (s === "islref" || s === "isl_ref") return "isl_ref";
    if (s === "name" || s.includes("eventname")) return "name";
    if (s.includes("eventtype") || s === "event_type") return "event_type";
    if (s.includes("programme")) return "programme";
    if (s.includes("editionyear") || s === "edition_year") return "edition_year";
    if (s.includes("theme")) return "theme";
    if (s.includes("datestart") || s === "date_start") return "date_start";
    if (s.includes("dateend") || s === "date_end") return "date_end";
    if (s.includes("venue")) return "venue";
    if (s.includes("funder")) return "funder";
    if (s.includes("partner")) return "partner_organisations";
    if (s.includes("totalreg") || s === "total_registered") return "total_registered";
    if (s.includes("totalatt") || s === "total_attended") return "total_attended";
    if (s.includes("femalecount") || s === "female_count") return "female_count";
    if (s.includes("malecount") || s === "male_count") return "male_count";
    if (s.includes("datasource") || s === "data_sources") return "data_sources";
    return "(ignore)";
  }
  if (table === "organisation") {
    if (s === "orgid" || s === "org_id") return "org_id";
    if (s === "islref" || s === "isl_ref") return "isl_ref";
    if (s === "name") return "name";
    if (s.includes("sector")) return "sector";
    if (s.includes("stage")) return "stage";
    if (s === "woman_led" || s === "is_woman_led" || s.includes("womanled") || s.includes("iswomanled")) return "woman_led";
    if (s.includes("youthled") || s === "youth_led") return "youth_led";
    if (s.includes("founder") && !s.includes("gender")) return "founder_person_id";
    if (s.includes("location")) return "location";
    if (s.includes("district")) return "district";
    if (s.includes("active")) return "active";
    if (s.includes("datasource") || s === "data_sources") return "data_sources";
    if (s === "business_name" || s.includes("businessname")) return "name";
    if (s === "business_ref" || s.includes("businessref")) return "isl_ref";
    if (s === "date_registered" || s.includes("dateregistered")) return "founded_date";
    if (s === "evaluation_summary" || s.includes("evaluationsummary")) return "description";
    return "(ignore)";
  }
  if (table === "eso_partner") {
    if (s === "esoid" || s === "eso_id") return "eso_id";
    if (s === "name") return "name";
    if (s.includes("esotype") || s === "eso_type") return "eso_type";
    if (s.includes("country")) return "country";
    if (s.includes("city")) return "city";
    if (s.includes("focus")) return "focus_sectors";
    if (s.includes("trainedbyisl") || s === "trained_by_isl") return "trained_by_isl";
    if (s.includes("activepartner") || s === "active_partner") return "active_partner";
    if (s.includes("datasource") || s === "data_sources") return "data_sources";
    return "(ignore)";
  }
  if (table === "pitch") {
    if (s === "islref" || s === "isl_ref") return "isl_ref";
    if (s === "eventid" || s === "event_id") return "event_id";
    if (s === "personid" || s === "person_id") return "person_id";
    if (s === "orgid" || s === "org_id") return "org_id";
    if (s.includes("category")) return "category";
    if (s.includes("subcategory")) return "sub_category";
    if (s.includes("idea") || s.includes("description")) return "idea_description";
    if (s.includes("winnerflag") || s === "winner_flag") return "winner_flag";
    if (s.includes("firstfemale") || s === "first_female_flag") return "first_female_flag";
    if (s.includes("prizea")) return "prize_amount";
    if (s === "score") return "score";
    if (s === "rank") return "rank";
    if (s.includes("notes")) return "notes";
    if (s.includes("datasource") || s === "data_sources") return "data_sources";
    return "(ignore)";
  }
  // person (default)
  if (s === "islref" || s === "isl_ref") return "isl_ref";
  if (s === "fullname" || s === "full_name" || s === "name") return "full_name";
  if (s.includes("email")) return "email_primary";
  if (s.includes("phone") || s.includes("whatsapp")) return "phone_primary";
  if (s.includes("gender") || s.includes("sex")) return "gender";
  if (s === "agegroup" || s === "age_group") return "age_group";
  if (s.includes("age")) return "age_raw";
  if (s.includes("dob") || s.includes("birth")) return "date_of_birth";
  if (s.includes("location") || s.includes("city")) return "location";
  if (s.includes("district")) return "district";
  if (s.includes("national")) return "nationality";
  if (s === "iswoman" || s === "is_woman") return "is_woman";
  if (s === "isgirl" || s === "is_girl") return "is_girl";
  if (s === "isyouth" || s === "is_youth") return "is_youth";
  if (s === "isaged" || s === "is_aged") return "is_aged";
  if (s === "ispwd" || s === "is_pwd") return "is_pwd";
  if (s.includes("repeat")) return "is_repeat_beneficiary";
  if (s.includes("outsidefreetown") || s === "is_outside_freetown") return "is_outside_freetown";
  if (s.includes("firstengagement") || s === "first_engagement_date") return "first_engagement_date";
  if (s.includes("firstprogramme") || s === "first_programme") return "first_programme";
  if (s === "recordstatus" || s === "record_status") return "record_status";
  if (s === "importstatus" || s === "import_status") return "import_status";
  if (s.includes("datasource") || s === "data_sources") return "data_sources";
  if (s === "speaker_name" || s.includes("speakername")) return "full_name";
  if (s === "ref" || s === "application_ref" || s.includes("applicationref")) return "isl_ref";
  return "(ignore)";
}

interface Props {
  data: Record<string, string>[];
  onConfirm: (map: Record<string, string>, targetTable: string) => void;
}

export function FieldMapper({ data, onConfirm }: Props) {
  const sourceFields = useMemo(() => (data.length ? Object.keys(data[0]) : []), [data]);
  const detectedTable = useMemo(() => detectTable(sourceFields), [sourceFields]);
  const [targetTable, setTargetTable] = useState(detectedTable);

  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const f of sourceFields) m[f] = autoMap(f, detectedTable);
    return m;
  });

  function handleTableChange(t: string) {
    setTargetTable(t);
    const m: Record<string, string> = {};
    for (const f of sourceFields) m[f] = autoMap(f, t);
    setMapping(m);
  }

  const preview = data.slice(0, 3);
  const allFields = ["(ignore)", ...(TABLE_FIELDS[targetTable] ?? TABLE_FIELDS.person)];
  const mappedCount = Object.values(mapping).filter((v) => v !== "(ignore)").length;
  const requiredFields = REQUIRED_PER_TABLE[targetTable] ?? [];

  function handleConfirm() {
    const mapped = Object.values(mapping);
    const missing = requiredFields.filter((r) => !mapped.includes(r));
    if (missing.length > 0) {
      toast.error(`Must map at least one field to: ${missing.join(", ")}`);
      return;
    }
    onConfirm(mapping, targetTable);
    toast.success(`Field mapping confirmed for ${TABLE_LABELS[targetTable]} table — running validation…`);
  }

  return (
    <div>
      {/* Header */}
      <div className="px-4 py-2.5 bg-[#DBEAFE] border-b border-[#93C5FD] flex items-center justify-between flex-wrap gap-2">
        <p className="text-[11px] text-[#1E40AF]">
          Mapping <strong>{sourceFields.length}</strong> source columns from{" "}
          <strong>{data.length}</strong> rows → Innovation SL schema fields
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#1E40AF] font-medium">Target table:</span>
          <select
            value={targetTable}
            onChange={(e) => handleTableChange(e.target.value)}
            className="px-2 py-1 text-[10px] border border-[#93C5FD] rounded-md bg-white text-[#1E40AF] font-medium focus:outline-none"
          >
            {Object.keys(TABLE_LABELS).map((t) => (
              <option key={t} value={t}>{TABLE_LABELS[t]}</option>
            ))}
          </select>
          <span className="text-[10px] text-[#3B82F6]">{mappedCount} of {sourceFields.length} mapped</span>
        </div>
      </div>

      {/* Detection banner */}
      <div className="px-4 py-1.5 bg-[#F5F2FD] border-b border-[#EDE8F8] flex items-center gap-2 flex-wrap">
        <span className="text-[9px] font-medium text-[#7B5EA7] uppercase tracking-wide">Auto-detected:</span>
        <span className="pill bg-[#EDE8F8] text-[#4A2FA0] text-[9px]">{TABLE_LABELS[detectedTable]} table</span>
        {detectedTable !== targetTable && (
          <span className="text-[9px] text-amber-600">· Overridden to {TABLE_LABELS[targetTable]}</span>
        )}
        <span className="ml-auto text-[9px] text-[#9490a8]">
          Required fields: <strong>{requiredFields.join(", ")}</strong>
        </span>
      </div>

      {/* Mapping table */}
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-[#F5F2FD]">
              <th className="px-4 py-2 text-left text-[9px] uppercase tracking-wider text-muted-foreground w-[30%]">Source column</th>
              <th className="px-2 text-center text-[9px] text-muted-foreground w-6">→</th>
              <th className="px-4 py-2 text-left text-[9px] uppercase tracking-wider text-muted-foreground w-[35%]">Maps to (schema field)</th>
              <th className="px-4 py-2 text-left text-[9px] uppercase tracking-wider text-muted-foreground">Preview (row 1)</th>
            </tr>
          </thead>
          <tbody>
            {sourceFields.map((f) => {
              const isRequired = requiredFields.includes(mapping[f]);
              const isMapped = mapping[f] !== "(ignore)";
              return (
                <tr key={f} className="border-b border-border hover:bg-[#F5F2FD]">
                  <td className="px-4 py-2 font-mono text-[10px] bg-muted/10 text-muted-foreground">{f}</td>
                  <td className="px-1 text-[#7B5EA7] font-medium text-center">→</td>
                  <td className="px-4 py-1.5">
                    <select
                      value={mapping[f]}
                      onChange={(e) => setMapping((m) => ({ ...m, [f]: e.target.value }))}
                      className={`w-full px-2 py-1 text-[10px] border rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D1B69]/40 transition-colors
                        ${isRequired ? "border-green-400 bg-green-50 text-green-800 font-medium"
                          : isMapped  ? "border-[#7B5EA7] bg-[#EDE8F8] text-[#2D1B69]"
                                      : "border-border bg-white text-muted-foreground italic"}`}
                    >
                      {allFields.map((sf) => (
                        <option key={sf} value={sf}>{sf}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground truncate max-w-[200px] text-[10px]">
                    {preview[0]?.[f] ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-2 flex-wrap">
        <button
          onClick={handleConfirm}
          className="px-4 py-2 bg-[#15803D] text-white rounded-lg text-[11px] font-medium hover:bg-green-700 transition-colors"
        >
          Confirm mapping → validate
        </button>
        <button
          onClick={() => {
            const m: Record<string, string> = {};
            for (const f of sourceFields) m[f] = autoMap(f, targetTable);
            setMapping(m);
            toast.success("Fields auto-mapped based on column names");
          }}
          className="px-4 py-2 bg-[#EDE8F8] text-[#4A2FA0] border border-[#7B5EA7] rounded-lg text-[11px] font-medium hover:bg-[#D8D0F5] transition-colors"
        >
          Auto-map all
        </button>
        <button
          className="px-4 py-2 bg-white border border-border rounded-lg text-[11px] hover:bg-muted/50 transition-colors"
          onClick={() => toast.success("Template saved for future imports of this source")}
        >
          Save as template
        </button>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {mappedCount} of {sourceFields.length} columns mapped · target table:{" "}
          <strong className="text-[#2D1B69]">{targetTable}</strong>
        </span>
      </div>
    </div>
  );
}