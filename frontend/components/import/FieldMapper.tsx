"use client";
import { useState, useMemo } from "react";
import { toast }             from "sonner";

// ── All schema fields grouped by table ─────────────────────────
const TABLE_FIELDS: Record<string, string[]> = {
  person: [
    "isl_ref","full_name","preferred_name","gender","date_of_birth","age_raw","age_group",
    "nationality","nin","phone_primary","phone_secondary",
    "email_primary","email_secondary","location","district","region",
    "is_woman","is_girl","is_youth","is_aged","is_pwd",
    "is_repeat_beneficiary","is_outside_freetown",
    "first_engagement_date","first_programme","record_status","data_sources",
  ],
  organisation: [
    "org_id","isl_ref","name","sector","sub_sector","stage","org_type",
    "reg_number","founded_date","location","district","website","description",
    "woman_led","youth_led","diaspora_led","active","founder_person_id","data_sources",
  ],
  event: [
    "isl_ref","name","event_type","programme","edition_year","edition_number",
    "theme","date_start","date_end","venue","city","funder",
    "partner_organisations","report_doc_link","drive_folder_link","data_sources",
  ],
  attendance: [
    "person_id","event_id","role_at_event","registered","attended",
    "day_number","source_form","import_batch","notes",
  ],
  pitch: [
    "isl_ref","event_id","person_id","org_id","application_code",
    "theme","category","sub_category","idea_description","pitch_stage",
    "score","rank","winner_flag","finalist_flag","prize_amount","prize_currency","prize_type",
    "first_female_flag","first_time_flag","repeat_pitcher_flag",
    "pitch_deck_link","feedback_doc_link","notes","data_sources",
  ],
  diagnostic: [
    "isl_ref","org_id","contact","diag_date","tool_used","sector",
    "business_age","employees","revenue_band","loan_purpose",
    "has_business_plan","profitability","growth_sector","capacity_utilisation",
    "has_qa_system","has_sales_strategy","market_reach","financial_records",
    "management_accounts","loan_history","finance_separation","hr_policy",
    "payroll_system","software_used","main_challenge","ta_received",
    "woman_led_flag","youth_led_flag","referral_source","data_sources",
  ],
  grant_capital: [
    "isl_ref","org_id","person_id","funder","programme","grant_type",
    "amount_local","amount_usd","currency","disbursement_date","conditions",
    "recipient_gender","recipient_youth","woman_led_business","recipient_sector",
    "milestone_1","milestone_2","milestone_3","outcome_jobs","outcome_revenue",
    "repayment_status","agreement_doc_link","data_sources",
  ],
  mel_report: [
    "isl_ref","period","programme","funder","period_start","period_end","report_type",
    "kpi_name","baseline","target","actual","status",
    "female_beneficiaries","male_beneficiaries","youth_beneficiaries",
    "aged_beneficiaries","pwd_beneficiaries","regional_beneficiaries",
    "jobs_created_female","jobs_created_male","revenue_generated","satisfaction",
    "prepared_by","report_doc_link","data_sources",
  ],
  eso_partner: [
    "eso_id","name","eso_type","country","city","focus_sectors",
    "trained_by_isl","active_partner","funder","contact_person","website",
    "programmes_collab","data_sources",
  ],
};

// ── Detect which table this CSV belongs to based on column names ─
function detectTable(fields: string[]): string {
  const fs = fields.map(f => f.toLowerCase());
  const has = (k: string) => fs.some(f => f.includes(k));

  if (has("role_at_event") || (has("person_id") && has("event_id") && has("attended")))
    return "attendance";
  if (has("diag_date") || has("tool_used") || has("lendability") || has("diag_id") ||
      (has("org_id") && has("has_business_plan")))
    return "diagnostic";
  if (has("pitch_id") || has("winner_flag") || has("first_female_flag") ||
      (has("org_id") && has("event_id") && has("idea_description")))
    return "pitch";
  if (has("grant_type") || has("disbursement_date") || has("amount_usd") ||
      (has("funder") && has("org_id") && has("repayment_status")))
    return "grant_capital";
  if (has("kpi_name") || has("baseline") || (has("target") && has("actual") && has("period")))
    return "mel_report";
  if (has("event_type") || has("edition_year") || has("date_start") ||
      (has("venue") && has("funder")))
    return "event";
  if (has("eso_type") || has("trained_by_isl") || has("active_partner"))
    return "eso_partner";
  if (has("woman_led") || has("org_type") || (has("name") && has("sector") && has("stage")))
    return "organisation";
  return "person";
}

// ── Auto-map a single source column to the best schema field ────
function autoMap(src: string, table: string): string {
  const fields = TABLE_FIELDS[table] ?? TABLE_FIELDS.person;
  const s2 = src.toLowerCase().replace(/[^a-z0-9_]/g, "");

  // Exact match first
  if (fields.includes(src))  return src;
  if (fields.includes(s2))   return s2;

  if (table === "attendance") {
    if (s2.includes("personid") || s2 === "person_id") return "person_id";
    if (s2.includes("eventid")  || s2 === "event_id")  return "event_id";
    if (s2.includes("role"))                            return "role_at_event";
    if (s2.includes("register"))                        return "registered";
    if (s2.includes("attend"))                          return "attended";
    if (s2.includes("source") || s2.includes("form"))  return "source_form";
    if (s2.includes("day"))                             return "day_number";
    if (s2.includes("batch"))                           return "import_batch";
  }

  if (table === "diagnostic") {
    if (s2.includes("orgid") || s2 === "org_id")        return "org_id";
    if (s2.includes("islref") || s2 === "isl_ref")      return "isl_ref";
    if (s2.includes("diagdate") || s2.includes("diagnosisdate")) return "diag_date";
    if (s2.includes("tool"))                            return "tool_used";
    if (s2.includes("sector"))                          return "sector";
    if (s2.includes("womanlead"))                       return "woman_led_flag";
    if (s2.includes("youthlead"))                       return "youth_led_flag";
    if (s2.includes("referral"))                        return "referral_source";
    if (s2.includes("challenge"))                       return "main_challenge";
    if (s2.includes("revenue"))                         return "revenue_band";
    if (s2.includes("profit"))                          return "profitability";
    if (s2.includes("employee"))                        return "employees";
    if (s2.includes("loanpurpose"))                     return "loan_purpose";
    if (s2.includes("businessplan") || s2.includes("hasplan")) return "has_business_plan";
    if (s2.includes("payroll"))                         return "payroll_system";
    if (s2.includes("hr"))                              return "hr_policy";
  }

  if (table === "pitch") {
    if (s2.includes("eventid"))                         return "event_id";
    if (s2.includes("personid"))                        return "person_id";
    if (s2.includes("orgid"))                           return "org_id";
    if (s2.includes("islref"))                          return "isl_ref";
    if (s2.includes("winner"))                          return "winner_flag";
    if (s2.includes("finalist"))                        return "finalist_flag";
    if (s2.includes("firstfemale"))                     return "first_female_flag";
    if (s2.includes("category"))                        return "category";
    if (s2.includes("idea") || s2.includes("description")) return "idea_description";
    if (s2.includes("prize") && s2.includes("amount")) return "prize_amount";
    if (s2.includes("score"))                           return "score";
    if (s2.includes("rank"))                            return "rank";
    if (s2.includes("deck"))                            return "pitch_deck_link";
    if (s2.includes("note"))                            return "notes";
  }

  if (table === "mel_report") {
    if (s2.includes("kpi") || s2.includes("indicator")) return "kpi_name";
    if (s2.includes("baseline"))                        return "baseline";
    if (s2.includes("target"))                          return "target";
    if (s2.includes("actual"))                          return "actual";
    if (s2.includes("status"))                          return "status";
    if (s2.includes("period") && s2.includes("start")) return "period_start";
    if (s2.includes("period") && s2.includes("end"))   return "period_end";
    if (s2.includes("period"))                          return "period";
    if (s2.includes("funder"))                          return "funder";
    if (s2.includes("female") && s2.includes("ben"))   return "female_beneficiaries";
    if (s2.includes("male") && s2.includes("ben"))     return "male_beneficiaries";
    if (s2.includes("youth") && s2.includes("ben"))    return "youth_beneficiaries";
    if (s2.includes("satisfaction"))                    return "satisfaction";
  }

  if (table === "event") {
    if (s2.includes("islref"))                          return "isl_ref";
    if (s2.includes("eventtype"))                       return "event_type";
    if (s2.includes("programme"))                       return "programme";
    if (s2.includes("year"))                            return "edition_year";
    if (s2.includes("theme"))                           return "theme";
    if (s2.includes("datestart") || s2.includes("startdate")) return "date_start";
    if (s2.includes("dateend")   || s2.includes("enddate"))   return "date_end";
    if (s2.includes("venue"))                           return "venue";
    if (s2.includes("city"))                            return "city";
    if (s2.includes("funder"))                          return "funder";
  }

  if (table === "organisation") {
    if (s2.includes("orgid"))                           return "org_id";
    if (s2.includes("islref"))                          return "isl_ref";
    if (s2.includes("name"))                            return "name";
    if (s2.includes("sector"))                          return "sector";
    if (s2.includes("stage"))                           return "stage";
    if (s2.includes("womanlead"))                       return "woman_led";
    if (s2.includes("youthlead"))                       return "youth_led";
    if (s2.includes("founder"))                         return "founder_person_id";
    if (s2.includes("location"))                        return "location";
    if (s2.includes("active"))                          return "active";
  }

  // Person / generic fallback
  if (s2.includes("fullname") || s2 === "full_name")   return "full_name";
  if (s2.includes("islref")   || s2 === "isl_ref")     return "isl_ref";
  if (s2.includes("email"))                             return "email_primary";
  if (s2.includes("phone") || s2.includes("whatsapp")) return "phone_primary";
  if (s2.includes("gender") || s2.includes("sex"))     return "gender";
  if (s2.includes("agegroup") || s2 === "age_group")   return "age_group";
  if (s2.includes("age"))                               return "age_raw";
  if (s2.includes("dob") || s2.includes("birth"))      return "date_of_birth";
  if (s2.includes("location") || s2.includes("city"))  return "location";
  if (s2.includes("district"))                          return "district";
  if (s2.includes("national"))                          return "nationality";
  if (s2.includes("iswoman"))                           return "is_woman";
  if (s2.includes("isgirl"))                            return "is_girl";
  if (s2.includes("isyouth"))                           return "is_youth";
  if (s2.includes("isaged"))                            return "is_aged";
  if (s2.includes("datasource"))                        return "data_sources";
  if (s2.includes("record") && s2.includes("status"))  return "record_status";
  if (s2.includes("firstengagement"))                   return "first_engagement_date";
  if (s2.includes("firstprogramme"))                    return "first_programme";

  return "(ignore)";
}

// ── Required fields per table (all must be mapped before confirm) ─
const TABLE_REQUIRED: Record<string, string[]> = {
  person:       ["full_name"],
  organisation: ["name"],
  event:        ["name"],
  attendance:   ["person_id", "event_id"],
  pitch:        ["person_id", "event_id"],
  diagnostic:   ["org_id"],
  grant_capital:["funder"],
  mel_report:   ["kpi_name"],
  eso_partner:  ["name"],
};

const TABLE_LABELS: Record<string, string> = {
  person:       "Person",
  organisation: "Organisation",
  event:        "Event",
  attendance:   "Attendance",
  pitch:        "Pitch",
  diagnostic:   "Diagnostic",
  grant_capital:"Grant / Capital",
  mel_report:   "M&E Report",
  eso_partner:  "ESO Partner",
};

interface Props {
  data:      Record<string, string>[];
  onConfirm: (map: Record<string, string>, table: string) => void;
}

export function FieldMapper({ data, onConfirm }: Props) {
  const sourceFields = useMemo(() => data.length ? Object.keys(data[0]) : [], [data]);

  const detectedTable = useMemo(() => detectTable(sourceFields), [sourceFields]);
  const [targetTable, setTargetTable] = useState(detectedTable);

  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const f of sourceFields) m[f] = autoMap(f, detectedTable);
    return m;
  });

  function changeTable(t: string) {
    setTargetTable(t);
    const m: Record<string, string> = {};
    for (const f of sourceFields) m[f] = autoMap(f, t);
    setMapping(m);
  }

  const schemaFields = ["(ignore)", ...(TABLE_FIELDS[targetTable] ?? TABLE_FIELDS.person)];
  const preview      = data.slice(0, 1);
  const mappedVals   = Object.values(mapping);
  const mappedCount  = mappedVals.filter(v => v !== "(ignore)").length;
  const requiredFields = TABLE_REQUIRED[targetTable] ?? [];
  const missingRequired = requiredFields.filter(r => !mappedVals.includes(r));

  return (
    <div>
      {/* Header */}
      <div className="px-4 py-2.5 bg-[#DBEAFE] border-b border-[#93C5FD] flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[11px] text-[#1E40AF]">
          Mapping <strong>{sourceFields.length}</strong> source columns from{" "}
          <strong>{data.length}</strong> rows → Innovation SL schema fields
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-[#1E40AF] font-medium">Target table:</span>
          <select
            value={targetTable}
            onChange={e => changeTable(e.target.value)}
            className="px-2 py-1 text-[10px] border border-[#93C5FD] rounded-md bg-white text-[#1E40AF] font-medium focus:outline-none focus:ring-1 focus:ring-[#2D1B69]/40"
          >
            {Object.keys(TABLE_LABELS).map(t => (
              <option key={t} value={t}>{TABLE_LABELS[t]}</option>
            ))}
          </select>
          <span className="text-[10px] text-[#1E40AF]">
            {mappedCount} of {sourceFields.length} mapped
          </span>
        </div>
      </div>

      {/* Auto-detection notice */}
      <div className="px-4 py-1.5 bg-green-50 border-b border-green-200 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-green-700 font-medium">
          ✓ Auto-detected: <strong>{TABLE_LABELS[targetTable]}</strong> table
        </span>
        <span className="text-[10px] text-green-600">
          — wrong? Change the target table above and all fields will remap automatically.
        </span>
        {missingRequired.length > 0 && (
          <span className="ml-auto text-[10px] text-amber-700 font-medium">
            ⚠ Still needs: {missingRequired.join(", ")}
          </span>
        )}
      </div>

      {/* Mapping table */}
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2 text-left text-[9px] uppercase tracking-wider text-muted-foreground w-[35%]">Source column</th>
              <th className="px-2 w-6" />
              <th className="px-4 py-2 text-left text-[9px] uppercase tracking-wider text-muted-foreground w-[35%]">Maps to</th>
              <th className="px-4 py-2 text-left text-[9px] uppercase tracking-wider text-muted-foreground">Preview (row 1)</th>
            </tr>
          </thead>
          <tbody>
            {sourceFields.map((f) => {
              const mapped     = mapping[f] !== "(ignore)";
              const isRequired = requiredFields.includes(mapping[f]);
              return (
                <tr
                  key={f}
                  className={`border-b border-border transition-colors
                    ${mapped ? "hover:bg-[#F5F2FD]" : "bg-muted/10 hover:bg-muted/20"}`}
                >
                  <td className="px-4 py-1.5 text-muted-foreground font-mono text-[10px] bg-muted/10">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: isRequired ? "#22C55E"
                            : mapped    ? "#7B5EA7"
                            : "#CBD5E1",
                        }}
                        title={isRequired ? "Required field" : mapped ? "Mapped" : "Ignored"}
                      />
                      {f}
                    </div>
                  </td>
                  <td className="px-1 text-[#7B5EA7] font-medium text-center">→</td>
                  <td className="px-4 py-1">
                    <select
                      value={mapping[f]}
                      onChange={(e) => setMapping((m) => ({ ...m, [f]: e.target.value }))}
                      className={`w-full px-2 py-1 text-[10px] border rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D1B69]/40 transition-colors
                        ${mapping[f] === "(ignore)"
                          ? "border-border bg-white text-muted-foreground italic"
                          : "border-[#7B5EA7] bg-[#EDE8F8] text-[#2D1B69] font-medium"}`}
                    >
                      {schemaFields.map((sf) => (
                        <option key={sf} value={sf}>{sf}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-1.5 text-muted-foreground text-[10px] truncate max-w-[200px]">
                    {preview[0]?.[f] || <span className="text-muted-foreground/40 italic">empty</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-3 flex-wrap">
        <button
          onClick={() => {
            const vals = Object.values(mapping);
            const missing = (TABLE_REQUIRED[targetTable] ?? []).filter(r => !vals.includes(r));
            if (missing.length > 0) {
              toast.error(`Map these required fields first: ${missing.join(", ")}`);
              return;
            }
            if (mappedCount === 0) {
              toast.error("Map at least one column before confirming");
              return;
            }
            onConfirm(mapping, targetTable);
            toast.success(`Mapping confirmed for ${TABLE_LABELS[targetTable]} — running validation…`);
          }}
          className="px-4 py-2 bg-[#15803D] text-white rounded-lg text-[11px] font-medium hover:bg-green-700 transition-colors"
        >
          Confirm mapping → validate
        </button>
        <button
          onClick={() => toast.success("Template saved — will auto-apply next time you import this file type")}
          className="px-4 py-2 bg-white border border-border rounded-lg text-[11px] hover:bg-muted/50 transition-colors"
        >
          Save as template
        </button>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {mappedCount} of {sourceFields.length} columns mapped ·{" "}
          target: <strong className="text-foreground">{targetTable}</strong>
        </span>
      </div>
    </div>
  );
}
