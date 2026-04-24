import Fuse from "fuse.js";
import { normalisePhone, normaliseName, inferGender, toTitleCase } from "./utils";
import type { ValidationError, GenderType, AgeGroupType } from "@/types";

// ============================================================
//  CLEANING ENGINE
//  Runs client-side during import review, mirrored in Python worker
// ============================================================

export interface CleaningResult {
  cleaned:  Record<string, unknown>;
  errors:   ValidationError[];
  warnings: ValidationError[];
  score:    number;
}

// ── Name standardiser ─────────────────────────────────────────
export function cleanName(raw: string): { value: string; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  let name = raw.trim();

  if (!name) {
    errors.push({ field: "full_name", message: "Name is required", severity: "error" });
    return { value: "", errors };
  }
  if (name.length < 3) {
    errors.push({ field: "full_name", message: "Name too short (< 3 chars) — verify manually", severity: "warning", value: name });
  }
  if (/^\d+$/.test(name)) {
    errors.push({ field: "full_name", message: "Name appears to be a number", severity: "error", value: name });
  }

  // Title-case and normalise
  name = toTitleCase(name.replace(/\s+/g, " "));
  return { value: name, errors };
}

// ── Phone normaliser ─────────────────────────────────────────
export function cleanPhone(raw?: string): { value: string; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  if (!raw) return { value: "", errors };

  const normalised = normalisePhone(raw);
  if (!normalised.startsWith("+232")) {
    errors.push({
      field: "phone_primary",
      message: `Could not normalise to +232 format: "${raw}"`,
      severity: "warning",
      value: raw,
    });
    return { value: raw, errors };
  }
  return { value: normalised, errors };
}

// ── Gender inference ──────────────────────────────────────────
export function cleanGender(raw?: string, name?: string): { value: GenderType; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const normalised = raw?.trim().toLowerCase();

  const map: Record<string, GenderType> = {
    female: "Female", f: "Female", woman: "Female", girl: "Female",
    male: "Male", m: "Male", man: "Male", boy: "Male",
  };

  if (normalised && map[normalised]) return { value: map[normalised], errors };

  // Try to infer from name
  if (name) {
    const inferred = inferGender(name);
    if (inferred) {
      errors.push({
        field: "gender",
        message: `Gender inferred from name "${name}" — verify manually`,
        severity: "info",
        value: inferred,
      });
      return { value: inferred, errors };
    }
  }

  errors.push({
    field: "gender",
    message: "Gender unknown — manual review required",
    severity: "warning",
    value: raw,
  });
  return { value: "Unknown", errors };
}

// ── Age group classifier ──────────────────────────────────────
export function classifyAgeGroup(dob?: string, rawAge?: string): { value: AgeGroupType; errors: ValidationError[] } {
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

  // Try parsing age ranges like "18-25", "Below 18", "35-44"
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

// ── Email validator ───────────────────────────────────────────
export function cleanEmail(raw?: string): { value: string; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  if (!raw) return { value: "", errors };
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: "email_primary", message: `Invalid email format: "${raw}"`, severity: "error", value: raw });
    return { value: raw, errors };
  }
  return { value: email, errors };
}

// ── Completeness scorer ───────────────────────────────────────
export function scoreCompleteness(record: Record<string, unknown>): number {
  const weights: [string, number][] = [
    ["full_name",    20],
    ["gender",       15],
    ["email_primary",10],
    ["phone_primary",10],
    ["location",     10],
    ["age_group",    10],
    ["programme",    10],
    ["event_year",    5],
    ["nationality",   5],
    ["date_of_birth", 5],
  ];
  let score = 0;
  for (const [field, weight] of weights) {
    const val = record[field];
    if (val && val !== "Unknown" && val !== "" && val !== null) score += weight;
  }
  return Math.min(score, 100);
}

// ── Duplicate detector ────────────────────────────────────────
export function detectDuplicates(
  incoming: { email?: string; phone?: string; name: string },
  existing: Array<{ person_id: string; full_name: string; email_primary?: string; phone_primary?: string }>
): Array<{ person_id: string; confidence: number; match_type: string }> {
  const results: Array<{ person_id: string; confidence: number; match_type: string }> = [];

  for (const record of existing) {
    // Exact email match → 99%
    if (incoming.email && record.email_primary &&
        incoming.email.toLowerCase() === record.email_primary.toLowerCase()) {
      results.push({ person_id: record.person_id, confidence: 99, match_type: "Email exact" });
      continue;
    }
    // Exact phone match → 95%
    if (incoming.phone && record.phone_primary) {
      const normIn  = normalisePhone(incoming.phone);
      const normRec = normalisePhone(record.phone_primary);
      if (normIn === normRec && normIn.startsWith("+232")) {
        results.push({ person_id: record.person_id, confidence: 95, match_type: "Phone exact" });
        continue;
      }
    }
    // Fuzzy name match → calculate confidence
    const nameScore = fuzzyNameScore(incoming.name, record.full_name);
    if (nameScore >= 80) {
      results.push({ person_id: record.person_id, confidence: nameScore, match_type: "Name fuzzy" });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

function fuzzyNameScore(a: string, b: string): number {
  const na = normaliseName(a);
  const nb = normaliseName(b);
  if (na === nb) return 92;

  // Token sort ratio
  const ta = na.split(" ").sort().join(" ");
  const tb = nb.split(" ").sort().join(" ");
  if (ta === tb) return 88;

  // Levenshtein ratio
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  const ratio = 1 - dist / maxLen;
  return Math.round(ratio * 100);
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

// ── Attendance row cleaner ────────────────────────────────────
const VALID_ROLES = ["Pitcher","Exhibitor","Speaker","Judge","Host","Panelist",
                     "Volunteer","VIP","Delegate","Participant","Staff"];

export function cleanAttendanceRow(
  raw: Record<string, string>,
  fieldMap: Record<string, string>
): CleaningResult {
  const cleaned: Record<string, unknown> = {};
  const errors: ValidationError[]   = [];
  const warnings: ValidationError[] = [];

  const mapped: Record<string, string> = {};
  for (const [rawKey, schemaKey] of Object.entries(fieldMap)) {
    if (raw[rawKey] !== undefined) mapped[schemaKey] = raw[rawKey];
  }

  const personId = mapped.person_id?.trim();
  if (!personId) {
    errors.push({ field: "person_id", message: "person_id is required", severity: "error" });
  } else {
    cleaned.person_id = personId;
  }

  const eventId = mapped.event_id?.trim();
  if (!eventId) {
    errors.push({ field: "event_id", message: "event_id is required", severity: "error" });
  } else {
    cleaned.event_id = eventId;
  }

  const rawRole = mapped.role_at_event?.trim() ?? "";
  const role = VALID_ROLES.find((r) => r.toLowerCase() === rawRole.toLowerCase()) ?? "Participant";
  if (rawRole && role === "Participant" && rawRole.toLowerCase() !== "participant") {
    warnings.push({ field: "role_at_event", message: `Unknown role "${rawRole}", defaulted to Participant`, severity: "warning", value: rawRole });
  }
  cleaned.role_at_event = role;

  const parseBool = (v?: string) =>
    v?.toLowerCase() === "true" || v === "1" || v?.toLowerCase() === "yes";
  cleaned.registered = parseBool(mapped.registered);
  cleaned.attended   = parseBool(mapped.attended);

  if (mapped.source_form)  cleaned.source_form  = mapped.source_form.trim();
  if (mapped.import_batch) cleaned.import_batch = mapped.import_batch.trim();
  if (mapped.day_number) {
    const dn = parseInt(mapped.day_number, 10);
    if (!isNaN(dn)) cleaned.day_number = dn;
  }

  const score = cleaned.person_id && cleaned.event_id
    ? (mapped.source_form ? 90 : 75) : 0;

  return { cleaned, errors, warnings, score };
}

// ── Table-aware dispatcher ────────────────────────────────────
export function cleanRowForTable(
  raw: Record<string, string>,
  fieldMap: Record<string, string>,
  targetTable: string
): CleaningResult {
  if (targetTable === "attendance") return cleanAttendanceRow(raw, fieldMap);
  return cleanRow(raw, fieldMap);
}

// ── Full row cleaner (orchestrates all rules) ─────────────────
export function cleanRow(
  raw: Record<string, string>,
  fieldMap: Record<string, string>
): CleaningResult {
  const cleaned: Record<string, unknown> = {};
  const allErrors: ValidationError[] = [];

  // Map raw fields → schema fields
  const mapped: Record<string, string> = {};
  for (const [rawKey, schemaKey] of Object.entries(fieldMap)) {
    if (raw[rawKey] !== undefined) mapped[schemaKey] = raw[rawKey];
  }

  // Clean each field
  const { value: name, errors: nameErrors } = cleanName(mapped.full_name ?? "");
  cleaned.full_name = name;
  allErrors.push(...nameErrors);

  const { value: email, errors: emailErrors } = cleanEmail(mapped.email_primary);
  cleaned.email_primary = email;
  allErrors.push(...emailErrors);

  const { value: phone, errors: phoneErrors } = cleanPhone(mapped.phone_primary);
  cleaned.phone_primary = phone;
  allErrors.push(...phoneErrors);

  const { value: gender, errors: genderErrors } = cleanGender(mapped.gender, name);
  cleaned.gender = gender;
  allErrors.push(...genderErrors);

  const { value: ageGroup, errors: ageErrors } = classifyAgeGroup(mapped.date_of_birth, mapped.age_raw);
  cleaned.age_group = ageGroup;
  allErrors.push(...ageErrors);

  // Pass-through fields
  for (const field of ["location", "district", "nationality", "nin"]) {
    if (mapped[field]) cleaned[field] = mapped[field].trim();
  }

  // Compute completeness
  const score = scoreCompleteness({ ...cleaned, programme: mapped.programme, event_year: mapped.event_year });

  return {
    cleaned,
    errors:   allErrors.filter(e => e.severity === "error"),
    warnings: allErrors.filter(e => e.severity !== "error"),
    score,
  };
}
