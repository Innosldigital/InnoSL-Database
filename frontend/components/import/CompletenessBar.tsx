"use client";

const FIELDS = [
  { field: "Full name",    pct: 98 },
  { field: "Gender",       pct: 91 },
  { field: "Phone",        pct: 84 },
  { field: "Email",        pct: 67 },
  { field: "District",     pct: 72 },
  { field: "Age group",    pct: 55 },
  { field: "Organisation", pct: 48 },
  { field: "Date of birth",pct: 31 },
] as const;

function barColour(pct: number) {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 50) return "bg-amber-400";
  return "bg-red-400";
}

export function CompletenessBar() {
  const overall = Math.round(FIELDS.reduce((s, f) => s + f.pct, 0) / FIELDS.length);

  return (
    <div className="isl-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <span className="text-[12px] font-semibold text-foreground">Data completeness</span>
          <span className="ml-2 text-[10px] text-muted-foreground">across all active person records</span>
        </div>
        <span className="text-[13px] font-bold text-[#2D1B69]">{overall}% avg</span>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
        {FIELDS.map((f) => (
          <div key={f.field} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{f.field}</span>
              <span className={`text-[10px] font-semibold ${f.pct >= 80 ? "text-green-700" : f.pct >= 50 ? "text-amber-700" : "text-red-600"}`}>
                {f.pct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColour(f.pct)}`} style={{ width: `${f.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
