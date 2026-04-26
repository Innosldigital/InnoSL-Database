"use client";
import { useState }   from "react";
import { toast }      from "sonner";
import { cleanRowForTable } from "@/lib/cleaning-engine";
import { getScoreColour } from "@/lib/utils";

interface Props {
  batchId:      string;
  stagingId?:   string;
  fieldMap:     Record<string, string>;
  data:         Record<string, string>[];
  targetTable:  string;
}

export function ApprovalPanel({ batchId, stagingId, fieldMap, data, targetTable }: Props) {
  const [approved, setApproved]   = useState<Set<number>>(new Set());
  const [pushed, setPushed]       = useState(false);
  const [pushing, setPushing]     = useState(false);
  const [pushResult, setPushResult] = useState<{ inserted: number; errors: string[] } | null>(null);

  const cleaned = data
    .map((row, i) => ({ ...cleanRowForTable(row, fieldMap, targetTable), idx: i }))
    .filter((r) => r.errors.length === 0);

  function approveRow(idx: number) {
    setApproved((s) => new Set(s).add(idx));
  }

  async function approveAll() {
    setPushing(true);
    const records = cleaned.map((r) => r.cleaned);

    const promise = fetch("/api/import/approve", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        records,
        batch_id:     batchId,
        staging_id:   stagingId,
        source_name:  "Manual import",
        target_table: targetTable,
      }),
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      setPushResult(json);
      setPushed(true);
      return json;
    }).finally(() => setPushing(false));

    toast.promise(promise, {
      loading: `Pushing ${cleaned.length} records to Supabase…`,
      success: (r: any) => `${r.inserted} records saved to the live database!`,
      error:   (e) => `Import failed: ${e.message}`,
    });
  }

  if (pushed && pushResult) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 gap-3">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">✓</div>
        <p className="text-[14px] font-medium text-green-800">Import complete!</p>
        <p className="text-[11px] text-muted-foreground text-center">
          {pushResult.inserted} records pushed to the live database. They are now searchable and visible across all views.
        </p>
        {pushResult.errors.length > 0 && (
          <details className="text-[10px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 max-w-sm w-full">
            <summary className="cursor-pointer font-medium">{pushResult.errors.length} row-level errors</summary>
            <ul className="mt-1 space-y-0.5 list-disc list-inside">
              {pushResult.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </details>
        )}
        <a
          href={targetTable === "attendance" ? "/events" : "/people"}
          className="px-4 py-2 bg-[#2D1B69] text-white rounded-lg text-[11px] font-medium"
        >
          {targetTable === "attendance" ? "View events →" : "View people →"}
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-2.5 bg-green-50 border-b border-green-200 text-[11px] text-green-800 font-medium">
        {cleaned.length} records clean and ready to approve · {data.length - cleaned.length} held for review
      </div>

      <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
        <table className="w-full text-[10px]">
          <thead className="sticky top-0">
            <tr className="border-b border-border bg-muted/40">
              {(targetTable === "attendance"
                ? ["Person ID","Event ID","Role","Registered","Attended","Score","Action"]
                : ["Name","Gender","Age group","Business","Phone","Score","Action"]
              ).map((h) => (
                <th key={h} className="px-3 py-2 text-left text-[9px] uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cleaned.slice(0, 50).map((r) => {
              const isApproved = approved.has(r.idx);
              return (
                <tr key={r.idx} className="border-b border-border hover:bg-[#F5F2FD]">
                  {targetTable === "attendance" ? (
                    <>
                      <td className="px-3 py-2 font-mono text-[9px] text-muted-foreground truncate max-w-[120px]">{r.cleaned.person_id as string || "—"}</td>
                      <td className="px-3 py-2 font-mono text-[9px] text-muted-foreground truncate max-w-[120px]">{r.cleaned.event_id as string || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.cleaned.role_at_event as string || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{String(r.cleaned.registered)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{String(r.cleaned.attended)}</td>
                    </>
                  ) : (
                    <>
                      <td className={`px-3 py-2 font-medium ${r.errors.length > 0 ? "text-amber-700" : "text-foreground"}`}>
                        {r.cleaned.full_name as string || "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{r.cleaned.gender as string || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.cleaned.age_group as string || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground truncate max-w-[120px]">{r.cleaned.business_name as string || "—"}</td>
                      <td className={`px-3 py-2 ${r.warnings.some(w => w.field === "phone_primary") ? "text-amber-700" : "text-muted-foreground"}`}>
                        {r.cleaned.phone_primary as string || "—"}
                      </td>
                    </>
                  )}
                  <td className={`px-3 py-2 font-medium ${getScoreColour(r.score)}`}>{r.score}%</td>
                  <td className="px-3 py-2">
                    {isApproved ? (
                      <span className="text-[9px] text-green-700 font-medium">✓ Approved</span>
                    ) : r.warnings.length > 0 ? (
                      <button onClick={() => approveRow(r.idx)}
                        className="px-2 py-0.5 text-[9px] bg-amber-100 text-amber-800 rounded hover:bg-amber-200 transition-colors font-medium">
                        Review
                      </button>
                    ) : (
                      <button onClick={() => approveRow(r.idx)}
                        className="px-2 py-0.5 text-[9px] bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors font-medium">
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-border flex items-center gap-3">
        <button
          onClick={approveAll}
          disabled={pushing || cleaned.length === 0}
          className="px-4 py-2 bg-[#2D1B69] text-white rounded-lg text-[11px] font-medium
                     hover:bg-[#4A2FA0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pushing ? "Pushing to database…" : `Approve all ${cleaned.length} clean records →`}
        </button>
        <span className="text-[10px] text-muted-foreground">
          Writes directly to Supabase · audit-logged against your account
        </span>
      </div>
    </div>
  );
}
