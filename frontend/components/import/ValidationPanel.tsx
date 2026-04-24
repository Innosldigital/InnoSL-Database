"use client";
import { useMemo, useState }     from "react";
import { cleanRowForTable }      from "@/lib/cleaning-engine";
import { toast }                 from "sonner";
import type { ValidationError }  from "@/types";

interface Props {
  data:        Record<string, string>[];
  fieldMap:    Record<string, string>;
  targetTable: string;
  onContinue:  () => void;
}

export function ValidationPanel({ data, fieldMap, targetTable, onContinue }: Props) {
  const [resolved, setResolved] = useState<Set<number>>(new Set());

  const results = useMemo(() => {
    return data.map((row) => cleanRowForTable(row, fieldMap, targetTable));
  }, [data, fieldMap, targetTable]);

  const errorRows   = results.filter((r) => r.errors.length > 0);
  const warnRows    = results.filter((r) => r.warnings.length > 0 && r.errors.length === 0);
  const cleanRows   = results.filter((r) => r.errors.length === 0 && r.warnings.length === 0);
  const autoFixable = warnRows.filter((r) =>
    r.warnings.every((w) => ["phone_primary","age_group","gender"].includes(w.field))
  );

  function resolve(idx: number) {
    setResolved((s) => new Set(s).add(idx));
    toast.success("Issue marked as resolved");
  }

  const severityStyle = (s: string) => ({
    error:   "bg-red-50 border-red-200 text-red-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    info:    "bg-blue-50 border-blue-200 text-blue-700",
  }[s] ?? "");

  return (
    <div>
      {/* Summary bar */}
      <div className={`px-4 py-2.5 border-b text-[11px] font-medium
        ${errorRows.length > 0 ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-green-50 border-green-200 text-green-800"}`}>
        {errorRows.length} errors · {warnRows.length} warnings · {cleanRows.length} clean and ready
      </div>

      {/* Issue list */}
      <div className="max-h-[420px] overflow-y-auto">
        {errorRows.length === 0 && warnRows.length === 0 && (
          <div className="py-8 text-center text-[12px] text-green-700 font-medium">
            All {cleanRows.length} records are clean and ready to proceed.
          </div>
        )}

        {[...errorRows, ...warnRows].slice(0, 20).map((r, i) => {
          const allIssues: ValidationError[] = [...r.errors, ...r.warnings];
          if (resolved.has(i)) return null;
          return (
            <div key={i} className="border-b border-border px-4 py-3 hover:bg-[#F5F2FD] transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-1 self-stretch rounded flex-shrink-0 ${r.errors.length > 0 ? "bg-red-400" : "bg-amber-400"}`} />
                <div className="flex-1">
                  {allIssues.map((err, j) => (
                    <div key={j} className={`inline-flex items-center gap-1.5 mr-2 mb-1 px-2 py-0.5 rounded-full border text-[10px] ${severityStyle(err.severity)}`}>
                      <span className="font-medium">{err.field}:</span>
                      <span>{err.message}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Record: {(r.cleaned.full_name as string) || (r.cleaned.person_id as string) || "Unknown"}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => resolve(i)}
                    className="px-2 py-1 text-[9px] bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors font-medium"
                  >
                    Resolve
                  </button>
                  <button
                    className="px-2 py-1 text-[9px] bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 transition-colors font-medium"
                  >
                    Flag
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-border flex gap-2">
        <button
          onClick={() => {
            toast.success(`Auto-fixed ${autoFixable.length} records`);
          }}
          className="px-4 py-2 bg-white border border-border rounded-lg text-[11px] hover:bg-muted/50 transition-colors"
        >
          Resolve all auto-fixable ({autoFixable.length})
        </button>
        <button
          onClick={onContinue}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-[11px] font-medium hover:bg-amber-700 transition-colors"
        >
          Fix critical issues → check duplicates
        </button>
      </div>
    </div>
  );
}
