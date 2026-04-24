"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface StagingRecord {
  staging_id:       string;
  source_name:      string;
  source_file:      string;
  import_batch:     string;
  target_table:     string;
  raw_data:         Record<string, unknown>[];
  mapped_data:      Record<string, unknown>[] | null;
  import_status:    string;
  reviewed_by:      string | null;
  created_at:       string;
}

const STATUS_STYLE: Record<string, string> = {
  Staging:      "bg-blue-100 text-blue-800",
  Clean:        "bg-green-100 text-green-800",
  Approved:     "bg-[#EDE8F8] text-[#2D1B69]",
  Rejected:     "bg-red-100 text-red-800",
  Needs_review: "bg-amber-100 text-amber-800",
};

export default function QueueReviewPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [record, setRecord]   = useState<StagingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(false);
  const [result,  setResult]  = useState<{ inserted: number; errors: string[]; status: string } | null>(null);

  useEffect(() => {
    fetch(`/api/import/queue/${id}`)
      .then(r => r.json())
      .then(setRecord)
      .finally(() => setLoading(false));
  }, [id]);

  async function act(action: "approve" | "reject") {
    setActing(true);
    const res = await fetch(`/api/import/queue/${id}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action }),
    });
    const json = await res.json();
    setActing(false);

    if (action === "reject") {
      toast.success("Import batch rejected.");
      router.push("/import/queue");
      return;
    }

    setResult(json);
    if (json.inserted > 0) {
      toast.success(`${json.inserted} records pushed to ${record?.target_table}.`);
    } else {
      toast.error(`0 records inserted. ${json.errors?.[0] ?? "Check errors below."}`);
    }
  }

  if (loading) return <div className="p-8 text-[12px] text-muted-foreground">Loading…</div>;
  if (!record) return <div className="p-8 text-[12px] text-red-600">Record not found.</div>;

  const rows    = record.mapped_data ?? record.raw_data ?? [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const isPending = record.import_status === "Staging" || record.import_status === "Needs_review" || record.import_status === "Clean";

  return (
    <div className="flex flex-col gap-4 p-4 max-w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => router.push("/import/queue")}
            className="text-[11px] text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1"
          >
            ← Import queue
          </button>
          <h1 className="text-[16px] font-semibold text-foreground">{record.source_file || record.source_name}</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {rows.length} rows · target: <strong className="capitalize">{record.target_table}</strong> · batch: {record.import_batch}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLE[record.import_status] ?? ""}`}>
            {record.import_status}
          </span>
        </div>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`rounded-xl border px-4 py-3 text-[11px] ${result.inserted > 0 ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {result.inserted > 0
            ? `✓ ${result.inserted} records inserted into ${record.target_table}.`
            : `✗ 0 records inserted — all rows were rejected.`}
          {result.errors?.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">{result.errors.length} errors</summary>
              <ul className="mt-1 space-y-0.5 list-disc list-inside text-[10px]">
                {result.errors.slice(0, 15).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </details>
          )}
          {result.inserted === 0 && record.target_table === "attendance" && (
            <p className="mt-2 text-[10px]">
              <strong>Likely cause:</strong> the <code>person_id</code> and <code>event_id</code> values in this CSV must be UUIDs that already exist in Supabase.
              Import your person and event records first, then re-import attendance using the UUIDs assigned by the database.
            </p>
          )}
        </div>
      )}

      {/* FK warning for attendance */}
      {record.target_table === "attendance" && record.import_status === "Needs_review" && !result && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800">
          <strong>Why this needs review:</strong> Attendance records require valid <code>person_id</code> and <code>event_id</code> UUIDs
          that already exist in the database. If your CSV used reference codes instead of UUIDs, all rows will be rejected.
          <br />
          <span className="text-[10px] mt-1 block">
            Check <a href="/api/db-health" className="underline" target="_blank">db-health</a> to see what persons and events are in the database,
            then update your CSV with the correct UUIDs before re-importing.
          </span>
        </div>
      )}

      {/* Data preview */}
      <div className="isl-card">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <span className="text-[11px] font-medium">Data preview — {rows.length} rows</span>
          <span className="text-[10px] text-muted-foreground">{record.mapped_data ? "Mapped data" : "Raw data"}</span>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-[10px]">
            <thead className="sticky top-0 bg-muted/40">
              <tr className="border-b border-border">
                {columns.map(col => (
                  <th key={col} className="px-3 py-2 text-left text-[9px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((row, i) => (
                <tr key={i} className="border-b border-border hover:bg-[#F5F2FD]">
                  {columns.map(col => (
                    <td key={col} className="px-3 py-1.5 text-muted-foreground truncate max-w-[180px]">
                      {String(row[col] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action footer */}
      {isPending && !result && (
        <div className="isl-card px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => act("approve")}
            disabled={acting}
            className="px-4 py-2 bg-[#2D1B69] text-white rounded-lg text-[11px] font-medium hover:bg-[#4A2FA0] transition-colors disabled:opacity-50"
          >
            {acting ? "Processing…" : `Approve all ${rows.length} rows →`}
          </button>
          <button
            onClick={() => act("reject")}
            disabled={acting}
            className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-[11px] font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Reject batch
          </button>
          <span className="text-[10px] text-muted-foreground ml-auto">
            Writes to <strong>{record.target_table}</strong> · audit-logged against your account
          </span>
        </div>
      )}

      {!isPending && !result && (
        <div className="text-[11px] text-muted-foreground px-1">
          This batch has already been <strong>{record.import_status.toLowerCase()}</strong> by {record.reviewed_by ?? "unknown"}.
        </div>
      )}
    </div>
  );
}
