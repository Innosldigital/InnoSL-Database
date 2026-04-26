"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface QueueItem {
  staging_id:    string;
  source_name:   string;
  source_file?:  string;
  import_batch:  string;
  target_table:  string;
  import_status: string;
  reviewed_by?:  string;
  created_at:    string;
  raw_data?:     unknown[];
}

const STATUS_STYLE: Record<string, string> = {
  Staging:"bg-blue-100 text-blue-800", Clean:"bg-green-100 text-green-800",
  Approved:"bg-[#EDE8F8] text-[#2D1B69]", Rejected:"bg-red-100 text-red-800",
  Needs_review:"bg-amber-100 text-amber-800",
};
const TABLE_LABELS: Record<string, string> = {
  person:"Person",organisation:"Organisation",event:"Event",
  attendance:"Attendance",pitch:"Pitch",diagnostic:"Diagnostic",
  eso_partner:"ESO Partner",mel_report:"M&E Report",pending:"Pending",
};
const IMPORT_ORDER = [
  {table:"person",step:1},{table:"organisation",step:2},{table:"event",step:3},
  {table:"attendance",step:4},{table:"pitch",step:5},{table:"diagnostic",step:6},
  {table:"eso_partner",step:7},{table:"mel_report",step:8},
];

export default function ImportQueuePage() {
  const [items,setItems]     = useState<QueueItem[]>([]);
  const [loading,setLoading] = useState(true);
  const [actingId,setActingId] = useState<string|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/import/queue");
      const d = await r.json();
      setItems(Array.isArray(d) ? d : []);
    } catch { setItems([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(item: QueueItem) {
    setActingId(item.staging_id);
    try {
      const res = await fetch("/api/import/approve", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({staging_id:item.staging_id, target_table:item.target_table,
          import_batch:item.import_batch, source_name:item.source_name}),
      });
      const json = await res.json();
      if (res.ok && json.inserted > 0) {
        toast.success(`✓ ${json.inserted} records pushed to ${TABLE_LABELS[json.target_table]??json.target_table}`);
        setItems(prev => prev.map(i => i.staging_id===item.staging_id ? {...i,import_status:"Approved"} : i));
      } else {
        toast.error(json.errors?.[0] ?? json.error ?? "0 records inserted — check Review page for details");
        setItems(prev => prev.map(i => i.staging_id===item.staging_id ? {...i,import_status:"Needs_review"} : i));
      }
    } catch(e:any) { toast.error(e.message); } finally { setActingId(null); }
  }

  async function handleReject(item: QueueItem) {
    setActingId(item.staging_id);
    try {
      await fetch(`/api/import/queue/${item.staging_id}`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"reject"}),
      });
      setItems(prev => prev.map(i => i.staging_id===item.staging_id ? {...i,import_status:"Rejected"} : i));
      toast.success("Batch rejected");
    } catch { toast.error("Reject failed"); } finally { setActingId(null); }
  }

  const pending   = items.filter(i => !["Approved","Rejected"].includes(i.import_status));
  const completed = items.filter(i =>  ["Approved","Rejected"].includes(i.import_status));

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-semibold">Import queue</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Review staged records awaiting approval or manual cleanup</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-1.5 text-[11px] border border-border rounded-lg bg-white hover:bg-muted/50">↻ Refresh</button>
          <Link href="/import" className="px-3 py-2 bg-[#2D1B69] text-white rounded-lg text-[11px] font-medium hover:bg-[#4A2FA0]">+ New import</Link>
        </div>
      </div>

      {/* Import order tracker */}
      <div className="isl-card p-4">
        <p className="text-[11px] font-medium text-[#2D1B69] mb-2.5">Required import order — approve in this sequence</p>
        <div className="grid grid-cols-8 gap-1.5">
          {IMPORT_ORDER.map(o => {
            const done    = completed.some(i => i.target_table===o.table && i.import_status==="Approved");
            const inQueue = pending.some(i => i.target_table===o.table);
            return (
              <div key={o.table} className={`p-2 rounded-lg border text-center
                ${done?"bg-green-50 border-green-200":inQueue?"bg-amber-50 border-amber-200":"bg-muted/30 border-border"}`}>
                <p className="text-[9px] font-bold text-muted-foreground">Step {o.step}</p>
                <p className={`text-[9px] font-medium mt-0.5 ${done?"text-green-800":"text-foreground"}`}>
                  {TABLE_LABELS[o.table]}
                </p>
                <p className={`text-[8px] mt-0.5 ${done?"text-green-600":inQueue?"text-amber-700":"text-muted-foreground"}`}>
                  {done?"✓ Done":inQueue?"Pending":"Not uploaded"}
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-[9px] text-amber-700 mt-2.5">
          ⚠ Approve Person (step 1) and Event (step 3) before Attendance (step 4).
          ISL reference codes like ISL-P-00001 are automatically resolved to UUIDs on approval.
        </p>
      </div>

      {/* Pending */}
      <div className="isl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-[12px] font-semibold text-[#2D1B69]">{pending.length} pending</span>
          <span className="text-muted-foreground text-[11px] ml-1">— awaiting approval or review</span>
        </div>
        {loading ? (
          <div className="py-10 text-center text-[11px] text-muted-foreground animate-pulse">Loading queue…</div>
        ) : pending.length === 0 ? (
          <div className="py-10 text-center text-[11px] text-muted-foreground">No pending imports.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead><tr>{["Source file","Target table","Batch","Rows","Status","Actions"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {pending.map(item => (
                  <tr key={item.staging_id}>
                    <td className="font-medium text-[11px] max-w-[140px] truncate">
                      <Link href={`/import/queue/${item.staging_id}`} className="hover:underline text-[#1E40AF]">
                        {item.source_file||item.source_name}
                      </Link>
                    </td>
                    <td><span className="pill bg-[#EDE8F8] text-[#4A2FA0]">{TABLE_LABELS[item.target_table]??item.target_table}</span></td>
                    <td className="text-[9px] text-muted-foreground font-mono max-w-[120px] truncate">{item.import_batch}</td>
                    <td className="text-[11px] text-center font-medium">{Array.isArray(item.raw_data)?item.raw_data.length:"—"}</td>
                    <td><span className={`pill text-[9px] ${STATUS_STYLE[item.import_status]??""}`}>{item.import_status}</span></td>
                    <td>
                      <div className="flex gap-1.5">
                        <button onClick={()=>handleApprove(item)} disabled={actingId===item.staging_id}
                          className="px-2.5 py-1 text-[9px] bg-[#2D1B69] text-white rounded-md hover:bg-[#4A2FA0] font-medium disabled:opacity-50">
                          {actingId===item.staging_id?"…":"Approve →"}
                        </button>
                        <Link href={`/import/queue/${item.staging_id}`}
                          className="px-2.5 py-1 text-[9px] bg-white border border-border rounded-md font-medium hover:bg-muted/50">
                          Review →
                        </Link>
                        <button onClick={()=>handleReject(item)} disabled={actingId===item.staging_id}
                          className="px-2.5 py-1 text-[9px] bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 font-medium disabled:opacity-50">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Completed */}
      <div className="isl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-[12px] font-semibold text-green-700">{completed.length} completed</span>
          <span className="text-muted-foreground text-[11px] ml-1">— approved or rejected</span>
        </div>
        {completed.length===0 ? (
          <div className="py-8 text-center text-[11px] text-muted-foreground">No records.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead><tr>{["Source file","Target table","Rows","Status","Reviewed by","Date"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {completed.map(item=>(
                  <tr key={item.staging_id}>
                    <td className="text-[11px] font-medium">{item.source_file||item.source_name}</td>
                    <td><span className="pill bg-[#EDE8F8] text-[#4A2FA0]">{TABLE_LABELS[item.target_table]??item.target_table}</span></td>
                    <td className="text-[11px] text-center">{Array.isArray(item.raw_data)?item.raw_data.length:"—"}</td>
                    <td><span className={`pill text-[9px] ${STATUS_STYLE[item.import_status]??""}`}>{item.import_status}</span></td>
                    <td className="text-[10px] text-muted-foreground">{item.reviewed_by?.slice(0,14)??"—"}</td>
                    <td className="text-[10px] text-muted-foreground">{item.created_at?.slice(0,10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}