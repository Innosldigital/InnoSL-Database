"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ValidationError } from "@/types";

interface Props {
  data:        Record<string, string>[];
  fieldMap:    Record<string, string>;
  targetTable: string;
  onContinue:  () => void;
}

// ── Per-table validation rules ────────────────────────────────
function validateRow(
  raw: Record<string, string>,
  fieldMap: Record<string, string>,
  table: string
): { errors: ValidationError[]; warnings: ValidationError[]; score: number; label: string } {
  const errors:   ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Build mapped record
  const mapped: Record<string, string> = {};
  for (const [src, schema] of Object.entries(fieldMap)) {
    if (schema !== "(ignore)" && raw[src] !== undefined) {
      mapped[schema] = raw[src];
    }
  }

  // ── PERSON validations ───────────────────────────────────
  if (table === "person") {
    if (!mapped.full_name || mapped.full_name.trim().length < 2) {
      errors.push({ field: "full_name", message: "Name is required", severity: "error" });
    }
    if (!mapped.gender || mapped.gender === "Unknown") {
      warnings.push({ field: "gender", message: "Gender unknown — manual review required", severity: "warning" });
    }
    if (!mapped.age_group && !mapped.age_raw && !mapped.date_of_birth) {
      warnings.push({ field: "age_group", message: "Cannot classify age — DOB or age range missing", severity: "warning" });
    }
    if (mapped.email_primary && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mapped.email_primary)) {
      errors.push({ field: "email_primary", message: `Invalid email: ${mapped.email_primary}`, severity: "error" });
    }
    if (mapped.phone_primary && !mapped.phone_primary.startsWith("+232")) {
      warnings.push({ field: "phone_primary", message: `Phone may need normalising: ${mapped.phone_primary}`, severity: "warning" });
    }
  }

  // ── ORGANISATION validations ─────────────────────────────
  else if (table === "organisation") {
    if (!mapped.name || mapped.name.trim().length < 2) {
      errors.push({ field: "name", message: "Organisation name is required", severity: "error" });
    }
    if (!mapped.sector) {
      warnings.push({ field: "sector", message: "Sector not specified", severity: "warning" });
    }
    if (!mapped.woman_led && !mapped.founder_person_id) {
      warnings.push({ field: "woman_led", message: "woman_led flag not set — defaulting to FALSE", severity: "info" });
    }
  }

  // ── EVENT validations ────────────────────────────────────
  else if (table === "event") {
    if (!mapped.name || mapped.name.trim().length < 2) {
      errors.push({ field: "name", message: "Event name is required", severity: "error" });
    }
    if (!mapped.event_type) {
      warnings.push({ field: "event_type", message: "Event type not set", severity: "warning" });
    }
    if (!mapped.date_start) {
      warnings.push({ field: "date_start", message: "Start date missing", severity: "warning" });
    }
  }

  // ── ATTENDANCE validations ───────────────────────────────
  else if (table === "attendance") {
    if (!mapped.person_id) {
      errors.push({ field: "person_id", message: "person_id is required (must match an existing person record)", severity: "error" });
    }
    if (!mapped.event_id) {
      errors.push({ field: "event_id", message: "event_id is required (must match an existing event record)", severity: "error" });
    }
    if (!mapped.role_at_event) {
      warnings.push({ field: "role_at_event", message: "Role not specified — will default to Participant", severity: "warning" });
    }
  }

  // ── PITCH validations ────────────────────────────────────
  else if (table === "pitch") {
    if (!mapped.event_id) {
      errors.push({ field: "event_id", message: "event_id is required", severity: "error" });
    }
    if (!mapped.person_id) {
      errors.push({ field: "person_id", message: "person_id is required", severity: "error" });
    }
    if (!mapped.idea_description && !mapped.category) {
      warnings.push({ field: "idea_description", message: "No pitch description or category", severity: "warning" });
    }
  }

  // ── DIAGNOSTIC validations ───────────────────────────────
  else if (table === "diagnostic") {
    if (!mapped.org_id) {
      errors.push({ field: "org_id", message: "org_id is required", severity: "error" });
    }
    if (!mapped.tool_used) {
      warnings.push({ field: "tool_used", message: "Diagnostic tool not specified", severity: "warning" });
    }
    if (!mapped.diag_date) {
      warnings.push({ field: "diag_date", message: "Diagnostic date missing", severity: "warning" });
    }
  }

  // ── ESO PARTNER validations ──────────────────────────────
  else if (table === "eso_partner") {
    if (!mapped.name || mapped.name.trim().length < 2) {
      errors.push({ field: "name", message: "Partner name is required", severity: "error" });
    }
  }

  // ── MEL REPORT validations ───────────────────────────────
  else if (table === "mel_report") {
    if (!mapped.kpi_name) {
      errors.push({ field: "kpi_name", message: "KPI name is required", severity: "error" });
    }
    if (!mapped.programme) {
      warnings.push({ field: "programme", message: "Programme not specified", severity: "warning" });
    }
    if (mapped.actual && mapped.target) {
      const a = parseFloat(mapped.actual), t = parseFloat(mapped.target);
      if (!isNaN(a) && !isNaN(t) && !mapped.status) {
        warnings.push({ field: "status", message: "Status not set — can be auto-computed from actual vs target", severity: "info" });
      }
    }
  }

  // Completeness score
  const mappedValues = Object.values(mapped).filter(v => v && v.trim() !== "");
  const totalFields  = Object.keys(fieldMap).filter(k => fieldMap[k] !== "(ignore)").length;
  const score        = totalFields > 0 ? Math.round((mappedValues.length / totalFields) * 100) : 0;

  // Label for display
  const label =
    mapped.full_name || mapped.name || mapped.kpi_name ||
    mapped.org_id    || mapped.person_id ||
    "Record";

  return { errors, warnings, score, label };
}

const TABLE_LABELS: Record<string, string> = {
  person: "Person", organisation: "Organisation", event: "Event",
  attendance: "Attendance", pitch: "Pitch", diagnostic: "Diagnostic",
  eso_partner: "ESO Partner", mel_report: "M&E Report",
};

// Friendly guidance per table
const TABLE_GUIDANCE: Record<string, string> = {
  person:       "Person records require full_name. Gender and age are recommended.",
  organisation: "Organisation records require name. woman_led and sector are recommended.",
  event:        "Event records require name and event_type.",
  attendance:   "Attendance records require person_id and event_id. Import persons and events first, then attendance.",
  pitch:        "Pitch records require event_id and person_id.",
  diagnostic:   "Diagnostic records require org_id. Import organisations first.",
  eso_partner:  "ESO Partner records require name.",
  mel_report:   "M&E Report records require kpi_name.",
};

export function ValidationPanel({ data, fieldMap, targetTable, onContinue }: Props) {
  const [resolved, setResolved] = useState<Set<number>>(new Set());

  const results = useMemo(() => {
    return data.map(row => validateRow(row, fieldMap, targetTable));
  }, [data, fieldMap, targetTable]);

  const errorRows   = results.filter(r => r.errors.length > 0);
  const warnRows    = results.filter(r => r.warnings.length > 0 && r.errors.length === 0);
  const cleanRows   = results.filter(r => r.errors.length === 0 && r.warnings.length === 0);

  const severityStyle = (s: string) => ({
    error:   "bg-red-50 border border-red-200 text-red-700",
    warning: "bg-amber-50 border border-amber-200 text-amber-700",
    info:    "bg-blue-50 border border-blue-200 text-blue-700",
  }[s] ?? "");

  return (
    <div>
      {/* Summary banner */}
      <div className={`px-4 py-2.5 border-b text-[11px] font-medium flex items-center justify-between
        ${errorRows.length > 0
          ? "bg-amber-50 border-amber-200 text-amber-800"
          : "bg-green-50 border-green-200 text-green-800"}`}>
        <span>
          {errorRows.length} errors · {warnRows.length} warnings · {cleanRows.length} clean and ready
        </span>
        <span className="text-[10px] font-normal opacity-70">
          Target: <strong>{TABLE_LABELS[targetTable] ?? targetTable}</strong> table · {data.length} rows
        </span>
      </div>

      {/* Guidance banner */}
      <div className="px-4 py-2 bg-[#F5F2FD] border-b border-[#EDE8F8] flex items-start gap-2">
        <span className="text-[#7B5EA7] text-[11px] mt-0.5">ℹ</span>
        <p className="text-[10px] text-[#5a5278]">{TABLE_GUIDANCE[targetTable]}</p>
      </div>

      {/* Special warning for attendance/pitch with ISL refs */}
      {(targetTable === "attendance" || targetTable === "pitch") && (
        <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-[11px] font-medium text-amber-800 mb-1">⚠ Import order required</p>
          <p className="text-[10px] text-amber-700">
            {targetTable === "attendance"
              ? "Attendance records link to persons and events via UUID. You must import 01_persons.csv and 03_events.csv into Supabase first. Once those records exist, Supabase will have real UUIDs — update person_id and event_id in this file to match those UUIDs, then re-import."
              : "Pitch records link to persons, events and organisations. Import persons, events and organisations first, then re-import pitches with the real UUIDs."}
          </p>
        </div>
      )}

      {/* Issue list */}
      <div className="max-h-[380px] overflow-y-auto mt-2">
        {errorRows.length === 0 && warnRows.length === 0 && (
          <div className="py-10 text-center text-[12px] text-green-700 font-medium">
            ✓ All {cleanRows.length} records are clean and ready to proceed.
          </div>
        )}

        {[...errorRows, ...warnRows].slice(0, 30).map((r, i) => {
          if (resolved.has(i)) return null;
          const allIssues: ValidationError[] = [...r.errors, ...r.warnings];
          return (
            <div key={i} className="border-b border-border px-4 py-3 hover:bg-[#F5F2FD] transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-1 self-stretch rounded flex-shrink-0 ${r.errors.length > 0 ? "bg-red-400" : "bg-amber-400"}`} />
                <div className="flex-1">
                  {allIssues.map((err, j) => (
                    <span
                      key={j}
                      className={`inline-flex items-center gap-1 mr-2 mb-1 px-2 py-0.5 rounded-full text-[10px] ${severityStyle(err.severity)}`}
                    >
                      <span className="font-medium">{err.field}:</span>
                      <span>{err.message}</span>
                    </span>
                  ))}
                  <p className="text-[10px] text-muted-foreground mt-1">Record: {r.label}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => { setResolved(s => new Set(s).add(i)); toast.success("Marked resolved"); }}
                    className="px-2 py-1 text-[9px] bg-green-100 text-green-800 rounded-md hover:bg-green-200 font-medium"
                  >
                    Resolve
                  </button>
                  <button className="px-2 py-1 text-[9px] bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 font-medium">
                    Flag
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-border flex gap-2 flex-wrap items-center">
        <button
          onClick={onContinue}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-[11px] font-medium hover:bg-amber-700 transition-colors"
        >
          Fix critical issues → check duplicates
        </button>
        {cleanRows.length > 0 && (
          <span className="text-[10px] text-green-700 font-medium">
            ✓ {cleanRows.length} records will proceed to approval
          </span>
        )}
        {(targetTable === "attendance" || targetTable === "pitch" || targetTable === "diagnostic") && (
          <span className="text-[10px] text-amber-700">
            ⚠ Import persons {targetTable !== "diagnostic" ? "& events " : "& organisations "}first — see note above
          </span>
        )}
      </div>
    </div>
  );
}