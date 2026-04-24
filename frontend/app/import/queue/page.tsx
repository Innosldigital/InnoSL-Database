import { getStagingQueue } from "@/lib/queries";
import { PageHeader }      from "@/components/shared/PageHeader";

export const metadata = { title: "Import Queue" };

const STATUS_STYLE: Record<string, string> = {
  Staging:      "bg-blue-100 text-blue-800",
  Clean:        "bg-green-100 text-green-800",
  Approved:     "bg-[#EDE8F8] text-[#2D1B69]",
  Rejected:     "bg-red-100 text-red-800",
  Needs_review: "bg-amber-100 text-amber-800",
};

export default async function ImportQueuePage() {
  const queue = await getStagingQueue();

  const pending  = queue.filter(r => r.import_status === "Staging" || r.import_status === "Clean" || r.import_status === "Needs_review");
  const done     = queue.filter(r => r.import_status === "Approved" || r.import_status === "Rejected");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Import queue"
        subtitle="Review staged records awaiting validation, approval or manual cleanup"
        actions={[
          { label: "New import", href: "/import", variant: "primary" },
        ]}
      />

      {/* Pending section */}
      <div className="isl-card">
        <div className="border-b border-border px-4 py-2.5 flex items-center gap-2">
          <span className="text-[11px] font-medium text-foreground">{pending.length} pending</span>
          <span className="text-[10px] text-muted-foreground">— awaiting approval or review</span>
        </div>
        <QueueTable rows={pending} />
      </div>

      {/* Completed section */}
      <div className="isl-card">
        <div className="border-b border-border px-4 py-2.5 flex items-center gap-2">
          <span className="text-[11px] font-medium text-foreground">{done.length} completed</span>
          <span className="text-[10px] text-muted-foreground">— approved or rejected</span>
        </div>
        <QueueTable rows={done} />
      </div>
    </div>
  );
}

function QueueTable({ rows }: { rows: any[] }) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-[12px] text-muted-foreground">
        No records.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full data-table">
        <thead>
          <tr>
            {["Source file", "Target table", "Batch", "Rows", "Status", "Reviewed by", "Created", ""].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.staging_id} className="cursor-pointer hover:bg-[#F5F2FD] transition-colors">
              <td className="text-[11px] font-medium text-[#2D1B69]">
                <a href={`/import/queue/${item.staging_id}`} className="hover:underline">
                  {item.source_file || item.source_name}
                </a>
              </td>
              <td className="text-[11px] text-muted-foreground capitalize">{item.target_table}</td>
              <td className="text-[11px] text-muted-foreground font-mono text-[10px]">{item.import_batch}</td>
              <td className="text-[11px] text-muted-foreground">
                {Array.isArray(item.raw_data) ? item.raw_data.length : "—"}
              </td>
              <td className="text-[11px]">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${STATUS_STYLE[item.import_status] ?? ""}`}>
                  {item.import_status}
                </span>
              </td>
              <td className="text-[11px] text-muted-foreground">{item.reviewed_by ?? "—"}</td>
              <td className="text-[11px] text-muted-foreground">{item.created_at?.slice(0, 10) ?? "—"}</td>
              <td className="text-[11px]">
                <a
                  href={`/import/queue/${item.staging_id}`}
                  className="px-2 py-0.5 text-[9px] bg-[#EDE8F8] text-[#2D1B69] rounded hover:bg-[#D8CFFE] transition-colors font-medium"
                >
                  Review →
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
