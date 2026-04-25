import { normalisePhone, normaliseName, inferGender, toTitleCase } from "./utils";
import type { ValidationError, GenderType, AgeGroupType } from "@/types";

export interface CleaningResult {
  cleaned:  Record<string, unknown>;
  errors:   ValidationError[];
  warnings: ValidationError[];
  score:    number;
}

// ── Helpers ───────────────────────────────────────────────────

const VALID_ROLES = [
  "Pitcher","Exhibitor","Speaker","Judge","Host","Panelist",
  "Volunteer","VIP","Delegate","Participant","Staff",
];

function parseBool(v?: string | boolean): boolean {
  if (typeof v === "boolean") return v;
  return v?.toLowerCase() === "true" || v === "1" || v?.toLowerCase() === "yes";
}

function mapFields(
  raw: Record<string, string>,
  fieldMap: Record<string, string>
): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [rawKey, schemaKey] of Object.entries(fieldMap)) {
    if (schemaKey !== "(ignore)" && raw[rawKey] !== undefined) mapped[schemaKey] = raw[rawKey];
  }
  return mapped;
}

function cleanName(raw: string): { value: string; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  let name = raw.trim();
  if (!name) {
    errors.push({ field: "full_name", message: "Name is required", severity: "error" });
    return { value: "", errors };
  }
  if (name.length < 3)
    errors.push({ field: "full_name", message: "Name too short (< 3 chars) — verify manually", severity: "warning", value: name });
  if (/^\d+$/.test(name))
    errors.push({ field: "full_name", message: "Name appears to be a number", severity: "error", value: name });
  name = toTitleCase(name.replace(/\s+/g, " "));
  return { value: name, errors };
}

function cleanPhone(raw?: string): { value: string; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  if (!raw) return { value: "", errors };
  const normalised = normalisePhone(raw);
  if (!normalised.startsWith("+232")) {
    errors.push({ field: "phone_primary", message: `Could not normalise to +232 format: "${raw}"`, severity: "warning", value: raw });
    return { value: raw, errors };
  }
  return { value: normalised, errors };
}

function cleanGender(raw?: string, name?: string): { value: GenderType; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const map: Record<string, GenderType> = {
    female: "Female", f: "Female", woman: "Female", girl: "Female",
    male: "Male", m: "Male", man: "Male", boy: "Male",
  };
  const norm = raw?.trim().toLowerCase();
  if (norm && map[norm]) return { value: map[norm], errors };
  if (name) {
    const inferred = inferGender(name);
    if (inferred) {
      errors.push({ field: "gender", message: `Gender inferred from name "${name}" — verify manually`, severity: "info", value: inferred });
      return { value: inferred, errors };
    }
  }
  errors.push({ field: "gender", message: "Gender unknown — manual review required", severity: "warning", value: raw });
  return { value: "Unknown", errors };
}

function classifyAgeGroup(dob?: string, rawAge?: string): { value: AgeGroupType; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  if (dob) {
    try {
      const age = new Date().getFullYear() - new Date(dob).getFullYear();
      if (age < 18) return { value: "Girl",  errors };
      if (age < 36) return { value: "Youth", errors };
      if (age < 60) return { value: "Adult", errors };
      return { value: "Aged", errors };
    } catch {}
  }
  if (rawAge) {
    const lower = rawAge.toLowerCase();
    if (lower.includes("below 18") || lower.includes("14") || lower.includes("17"))
      return { value: "Girl", errors };
    const nums = rawAge.match(/\d+/g)?.map(Number) ?? [];
    if (nums.length) {
      const min = Math.min(...nums);
      if (min < 18) return { value: "Girl",  errors };
      if (min < 36) return { value: "Youth", errors };
      if (min < 60) return { value: "Adult", errors };
      return { value: "Aged", errors };
    }
  }
  errors.push({ field: "age_group", message: "Cannot classify age — DOB or age range missing", severity: "warning" });
  return { value: "Unknown", errors };
}

function cleanEmail(raw?: string): { value: string; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  if (!raw) return { value: "", errors };
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: "email_primary", message: `Invalid email format: "${raw}"`, severity: "error", value: raw });
    return { value: raw, errors };
  }
  return { value: email, errors };
}

function scoreCompleteness(record: Record<string, unknown>): number {
  const weights: [string, number][] = [
    ["full_name", 20], ["gender", 15], ["email_primary", 10], ["phone_primary", 10],
    ["location", 10], ["age_group", 10], ["programme", 10], ["event_year", 5],
    ["nationality", 5], ["date_of_birth", 5],
  ];
  let score = 0;
  for (const [field, weight] of weights) {
    const val = record[field];
    if (val && val !== "Unknown" && val !== "" && val !== null) score += weight;
  }
  return Math.min(score, 100);
}

// ── Main dispatcher ───────────────────────────────────────────

export function cleanRowForTable(
  raw: Record<string, string>,
  fieldMap: Record<string, string>,
  targetTable: string
): CleaningResult {
  const errors:   ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const cleaned:  Record<string, unknown> = {};
  const mapped = mapFields(raw, fieldMap);

  switch (targetTable) {

    case "attendance": {
      const pid = mapped.person_id?.trim();
      const eid = mapped.event_id?.trim();
      if (!pid) errors.push({ field: "person_id", message: "person_id is required", severity: "error" });
      else cleaned.person_id = pid;
      if (!eid) errors.push({ field: "event_id", message: "event_id is required", severity: "error" });
      else cleaned.event_id = eid;
      const rawRole = mapped.role_at_event?.trim() ?? "";
      const role = VALID_ROLES.find(r => r.toLowerCase() === rawRole.toLowerCase()) ?? "Participant";
      if (rawRole && role === "Participant" && rawRole.toLowerCase() !== "participant")
        warnings.push({ field: "role_at_event", message: `Unknown role "${rawRole}", defaulted to Participant`, severity: "warning" });
      cleaned.role_at_event = role;
      cleaned.registered = parseBool(mapped.registered);
      cleaned.attended   = parseBool(mapped.attended);
      if (mapped.source_form)  cleaned.source_form  = mapped.source_form.trim();
      if (mapped.import_batch) cleaned.import_batch = mapped.import_batch.trim();
      if (mapped.day_number) { const dn = parseInt(mapped.day_number, 10); if (!isNaN(dn)) cleaned.day_number = dn; }
      return { cleaned, errors, warnings, score: cleaned.person_id && cleaned.event_id ? 90 : 0 };
    }

    case "organisation": {
      const name = mapped.name?.trim();
      if (!name || name.length < 2) errors.push({ field: "name", message: "Organisation name is required", severity: "error" });
      else cleaned.name = name;
      if (mapped.isl_ref)           cleaned.isl_ref = mapped.isl_ref.trim();
      if (mapped.sector)            cleaned.sector = mapped.sector.trim();
      if (mapped.stage)             cleaned.stage = mapped.stage.trim();
      if (mapped.org_type)          cleaned.org_type = mapped.org_type.trim();
      if (mapped.location)          cleaned.location = mapped.location.trim();
      if (mapped.district)          cleaned.district = mapped.district.trim();
      if (mapped.founder_person_id) cleaned.founder_person_id = mapped.founder_person_id.trim();
      if (mapped.website)           cleaned.website = mapped.website.trim();
      if (mapped.description)       cleaned.description = mapped.description.trim();
      cleaned.woman_led    = parseBool(mapped.woman_led);
      cleaned.youth_led    = parseBool(mapped.youth_led);
      cleaned.diaspora_led = parseBool(mapped.diaspora_led);
      cleaned.active       = mapped.active ? parseBool(mapped.active) : true;
      if (mapped.data_sources) cleaned.data_sources = [mapped.data_sources.trim()];
      if (!mapped.sector) warnings.push({ field: "sector", message: "Sector not specified", severity: "warning" });
      return { cleaned, errors, warnings, score: Math.min(Math.round((Object.keys(cleaned).length / 8) * 100), 100) };
    }

    case "event": {
      const name = mapped.name?.trim();
      if (!name || name.length < 2) errors.push({ field: "name", message: "Event name is required", severity: "error" });
      else cleaned.name = name;
      if (mapped.isl_ref)          cleaned.isl_ref = mapped.isl_ref.trim();
      if (mapped.event_type)       cleaned.event_type = mapped.event_type.trim();
      if (mapped.programme)        cleaned.programme = mapped.programme.trim();
      if (mapped.edition_year)     { const y = parseInt(mapped.edition_year); if (!isNaN(y)) cleaned.edition_year = y; }
      if (mapped.theme)            cleaned.theme = mapped.theme.trim();
      if (mapped.date_start)       cleaned.date_start = mapped.date_start.trim();
      if (mapped.date_end)         cleaned.date_end = mapped.date_end.trim();
      if (mapped.venue)            cleaned.venue = mapped.venue.trim();
      if (mapped.city)             cleaned.city = mapped.city.trim();
      if (mapped.funder)           cleaned.funder = mapped.funder.trim();
      if (mapped.partner_organisations) cleaned.partner_organisations = [mapped.partner_organisations.trim()];
      if (!mapped.event_type) warnings.push({ field: "event_type", message: "Event type not set", severity: "warning" });
      if (!mapped.date_start) warnings.push({ field: "date_start", message: "Start date missing", severity: "warning" });
      return { cleaned, errors, warnings, score: Math.min(Math.round((Object.keys(cleaned).length / 8) * 100), 100) };
    }

    case "pitch": {
      if (!mapped.event_id)  errors.push({ field: "event_id",  message: "event_id is required",  severity: "error" });
      else cleaned.event_id = mapped.event_id.trim();
      if (!mapped.person_id) errors.push({ field: "person_id", message: "person_id is required", severity: "error" });
      else cleaned.person_id = mapped.person_id.trim();
      if (mapped.isl_ref)           cleaned.isl_ref = mapped.isl_ref.trim();
      if (mapped.org_id)            cleaned.org_id = mapped.org_id.trim();
      if (mapped.category)          cleaned.category = mapped.category.trim();
      if (mapped.idea_description)  cleaned.idea_description = mapped.idea_description.trim();
      if (mapped.score)             { const s = parseFloat(mapped.score); if (!isNaN(s)) cleaned.score = s; }
      if (mapped.rank)              { const r = parseInt(mapped.rank);    if (!isNaN(r)) cleaned.rank  = r; }
      cleaned.winner_flag         = parseBool(mapped.winner_flag);
      cleaned.finalist_flag       = parseBool(mapped.finalist_flag);
      cleaned.first_female_flag   = parseBool(mapped.first_female_flag);
      cleaned.first_time_flag     = parseBool(mapped.first_time_flag);
      cleaned.repeat_pitcher_flag = parseBool(mapped.repeat_pitcher_flag);
      if (mapped.notes) cleaned.notes = mapped.notes.trim();
      return { cleaned, errors, warnings, score: cleaned.event_id && cleaned.person_id ? 80 : 0 };
    }

    case "diagnostic": {
      if (!mapped.org_id) errors.push({ field: "org_id", message: "org_id is required", severity: "error" });
      else cleaned.org_id = mapped.org_id.trim();
      if (mapped.isl_ref)   cleaned.isl_ref   = mapped.isl_ref.trim();
      if (mapped.contact)   cleaned.contact   = mapped.contact.trim();
      if (mapped.diag_date) cleaned.diag_date = mapped.diag_date.trim();
      if (mapped.tool_used) cleaned.tool_used = mapped.tool_used.trim();
      if (mapped.sector)    cleaned.sector    = mapped.sector.trim();
      const diagFields = [
        "business_age","employees","revenue_band","loan_purpose","has_business_plan",
        "profitability","growth_sector","capacity_utilisation","has_qa_system",
        "has_sales_strategy","market_reach","financial_records","management_accounts",
        "loan_history","finance_separation","hr_policy","payroll_system","software_used",
        "main_challenge","ta_received","referral_source","lendability_score",
        "strategic_score","process_score","support_score","overall_score","tier",
      ];
      for (const f of diagFields) { if (mapped[f]) cleaned[f] = mapped[f].trim(); }
      cleaned.woman_led_flag = parseBool(mapped.woman_led_flag);
      cleaned.youth_led_flag = parseBool(mapped.youth_led_flag);
      if (!mapped.tool_used) warnings.push({ field: "tool_used", message: "Diagnostic tool not specified", severity: "warning" });
      return { cleaned, errors, warnings, score: cleaned.org_id ? (mapped.tool_used ? 85 : 60) : 0 };
    }

    case "eso_partner": {
      const name = mapped.name?.trim();
      if (!name || name.length < 2) errors.push({ field: "name", message: "Partner name is required", severity: "error" });
      else cleaned.name = name;
      if (mapped.eso_id)         cleaned.eso_id = mapped.eso_id.trim();
      if (mapped.eso_type)       cleaned.eso_type = mapped.eso_type.trim();
      if (mapped.country)        cleaned.country = mapped.country.trim();
      if (mapped.city)           cleaned.city = mapped.city.trim();
      if (mapped.focus_sectors)  cleaned.focus_sectors = [mapped.focus_sectors.trim()];
      if (mapped.contact_person) cleaned.contact_person = mapped.contact_person.trim();
      if (mapped.website)        cleaned.website = mapped.website.trim();
      cleaned.trained_by_isl = parseBool(mapped.trained_by_isl);
      cleaned.active_partner  = mapped.active_partner ? parseBool(mapped.active_partner) : true;
      return { cleaned, errors, warnings, score: Math.min(Math.round((Object.keys(cleaned).length / 6) * 100), 100) };
    }

    case "mel_report": {
      if (!mapped.kpi_name) errors.push({ field: "kpi_name", message: "KPI name is required", severity: "error" });
      else cleaned.kpi_name = mapped.kpi_name.trim();
      if (mapped.isl_ref)   cleaned.isl_ref   = mapped.isl_ref.trim();
      if (mapped.period)    cleaned.period     = mapped.period.trim();
      if (mapped.programme) cleaned.programme  = mapped.programme.trim();
      if (mapped.funder)    cleaned.funder     = mapped.funder.trim();
      const numFields = [
        "baseline","target","actual","female_beneficiaries","male_beneficiaries",
        "youth_beneficiaries","aged_beneficiaries","jobs_created_female","jobs_created_male","satisfaction",
      ];
      for (const f of numFields) { if (mapped[f]) { const n = parseFloat(mapped[f]); if (!isNaN(n)) cleaned[f] = n; } }
      if (mapped.status)      cleaned.status      = mapped.status.trim();
      if (mapped.prepared_by) cleaned.prepared_by = mapped.prepared_by.trim();
      if (!mapped.programme) warnings.push({ field: "programme", message: "Programme not specified", severity: "warning" });
      return { cleaned, errors, warnings, score: cleaned.kpi_name ? (mapped.programme ? 90 : 70) : 0 };
    }

    case "grant_capital": {
      if (!mapped.isl_ref && !mapped.grant_type)
        errors.push({ field: "isl_ref", message: "isl_ref or grant_type required", severity: "warning" });
      if (mapped.isl_ref)            cleaned.isl_ref = mapped.isl_ref.trim();
      if (mapped.grant_type)         cleaned.grant_type = mapped.grant_type.trim();
      if (mapped.funder)             cleaned.funder = mapped.funder.trim();
      if (mapped.programme)          cleaned.programme = mapped.programme.trim();
      if (mapped.disbursement_date)  cleaned.disbursement_date = mapped.disbursement_date.trim();
      if (mapped.amount_usd)         { const a = parseFloat(mapped.amount_usd); if (!isNaN(a)) cleaned.amount_usd = a; }
      if (mapped.currency)           cleaned.currency = mapped.currency.trim();
      if (mapped.org_id)             cleaned.org_id = mapped.org_id.trim();
      if (mapped.person_id)          cleaned.person_id = mapped.person_id.trim();
      return { cleaned, errors, warnings, score: Math.min(Math.round((Object.keys(cleaned).length / 5) * 100), 100) };
    }

    default: {
      // person table — full cleaning with name/email/phone/gender/age normalisation
      const allErrors: ValidationError[] = [];

      const { value: name, errors: nameErrors }     = cleanName(mapped.full_name ?? "");
      cleaned.full_name = name;
      allErrors.push(...nameErrors);

      const { value: email, errors: emailErrors }   = cleanEmail(mapped.email_primary);
      cleaned.email_primary = email;
      allErrors.push(...emailErrors);

      const { value: phone, errors: phoneErrors }   = cleanPhone(mapped.phone_primary);
      cleaned.phone_primary = phone;
      allErrors.push(...phoneErrors);

      const { value: gender, errors: genderErrors } = cleanGender(mapped.gender, name);
      cleaned.gender = gender;
      allErrors.push(...genderErrors);

      const { value: ageGroup, errors: ageErrors }  = classifyAgeGroup(mapped.date_of_birth, mapped.age_raw);
      cleaned.age_group = ageGroup;
      allErrors.push(...ageErrors);

      for (const field of ["isl_ref","location","district","nationality","nin","first_programme",
                            "first_engagement_date","record_status","notes","preferred_name"]) {
        if (mapped[field]) cleaned[field] = mapped[field].trim();
      }
      for (const flag of ["is_woman","is_girl","is_youth","is_aged","is_pwd",
                           "is_repeat_beneficiary","is_outside_freetown"]) {
        if (mapped[flag] !== undefined) cleaned[flag] = parseBool(mapped[flag]);
      }
      if (mapped.data_sources) cleaned.data_sources = [mapped.data_sources.trim()];

      const score = scoreCompleteness({ ...cleaned, programme: mapped.programme });
      return {
        cleaned,
        errors:   allErrors.filter(e => e.severity === "error"),
        warnings: allErrors.filter(e => e.severity !== "error"),
        score,
      };
    }
  }
}

// ── Duplicate detector (used by DuplicateResolver) ────────────

export function detectDuplicates(
  incoming: { email?: string; phone?: string; name: string },
  existing: Array<{ person_id: string; full_name: string; email_primary?: string; phone_primary?: string }>
): Array<{ person_id: string; confidence: number; match_type: string }> {
  const results: Array<{ person_id: string; confidence: number; match_type: string }> = [];
  for (const record of existing) {
    if (incoming.email && record.email_primary &&
        incoming.email.toLowerCase() === record.email_primary.toLowerCase()) {
      results.push({ person_id: record.person_id, confidence: 99, match_type: "Email exact" });
      continue;
    }
    if (incoming.phone && record.phone_primary) {
      const normIn  = normalisePhone(incoming.phone);
      const normRec = normalisePhone(record.phone_primary);
      if (normIn === normRec && normIn.startsWith("+232")) {
        results.push({ person_id: record.person_id, confidence: 95, match_type: "Phone exact" });
        continue;
      }
    }
    const nameScore = fuzzyNameScore(incoming.name, record.full_name);
    if (nameScore >= 80)
      results.push({ person_id: record.person_id, confidence: nameScore, match_type: "Name fuzzy" });
  }
  return results.sort((a, b) => b.confidence - a.confidence);
}

function fuzzyNameScore(a: string, b: string): number {
  const na = normaliseName(a);
  const nb = normaliseName(b);
  if (na === nb) return 92;
  const ta = na.split(" ").sort().join(" ");
  const tb = nb.split(" ").sort().join(" ");
  if (ta === tb) return 88;
  const dist = levenshtein(na, nb);
  return Math.round((1 - dist / Math.max(na.length, nb.length)) * 100);
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}
