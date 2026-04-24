"use client";

const SOURCES = [
  { name: "FIW 2025 Registration", type: "Google Form", status: "live", rows: 312 },
  { name: "GEW 2025 Pitchers", type: "Google Form", status: "live", rows: 89 },
  { name: "OSVP 2024 Master", type: "Google Sheet", status: "synced", rows: 204 },
  { name: "Entrepreneur Database", type: "Excel", status: "manual", rows: 1840 },
  { name: "Dare2Aspire 2023 - GEW", type: "Google Form", status: "synced", rows: 156 },
] as const;

const STATUS_STYLE: Record<string, string> = {
  live: "bg-green-100 text-green-800",
  synced: "bg-blue-100 text-blue-800",
  manual: "bg-amber-100 text-amber-800",
};

export function ConnectedSources() {
  return (
    <div className="isl-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-[12px] font-semibold text-foreground">Connected sources</span>
        <span className="cursor-not-allowed text-[10px] font-medium text-muted-foreground opacity-70">+ Add source</span>
      </div>
      <div className="divide-y divide-border">
        {SOURCES.map((src) => (
          <div key={src.name} className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/30">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-foreground">{src.name}</span>
              <span className="text-[10px] text-muted-foreground">{src.type} - {src.rows.toLocaleString()} rows</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${STATUS_STYLE[src.status]}`}>
              {src.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
