interface GapRow {
  priority: number; gap: string; count: number;
  severity: string; impact: string; how: string;
}

interface HealthRow {
  entity: string; total: number; missing_gender: number;
  missing_phone: number; missing_real_email: number;
  low_completeness: number; avg_score: number;
}

interface Props { gaps: GapRow[]; health: HealthRow[] }

const SEVERITY_STYLE: Record<string, string> = {
  Critical: "bg-red-100 text-red-800 border border-red-200",
  High:     "bg-amber-100 text-amber-800 border border-amber-200",
  Medium:   "bg-blue-100 text-blue-800 border border-blue-200",
};

const SEVERITY_BAR: Record<string, string> = {
  Critical: "#EF4444",
  High:     "#F59E0B",
  Medium:   "#3B82F6",
};

export function DataHealthPriority({ gaps, health }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Health summary */}
      <div className="isl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-[12px] font-medium">Data completeness by table</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Table","Total records","Missing gender","Missing phone",
                  "Missing email","Low quality (<60%)","Avg score"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {health.map((r, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/20">
                  <td className="px-3 py-2.5 font-medium text-foreground capitalize">{r.entity.replace("_", " ")}</td>
                  <td className="px-3 py-2.5 text-center font-medium">{r.total}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={r.missing_gender > 0 ? "text-amber-700 font-medium" : "text-green-700"}>
                      {r.missing_gender > 0 ? r.missing_gender : "✓"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={r.missing_phone > 10 ? "text-red-700 font-medium" : "text-muted-foreground"}>
                      {r.missing_phone || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={r.missing_real_email > 20 ? "text-amber-700 font-medium" : "text-muted-foreground"}>
                      {r.missing_real_email || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={r.low_completeness > 5 ? "text-red-700 font-medium" : "text-green-700"}>
                      {r.low_completeness > 0 ? r.low_completeness : "✓"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {r.avg_score > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-muted/40 rounded-full min-w-[50px]">
                          <div className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${r.avg_score}%`,
                              background: r.avg_score >= 80 ? "#22C55E" : r.avg_score >= 60 ? "#F59E0B" : "#EF4444",
                            }} />
                        </div>
                        <span className="text-[9px] font-medium text-muted-foreground">{r.avg_score}%</span>
                      </div>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Priority gaps */}
      <div className="isl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-[12px] font-medium">Critical data gaps — ranked by donor impact</p>
        </div>
        <div className="divide-y divide-border">
          {gaps.map((g, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
              {/* Priority number */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: SEVERITY_BAR[g.severity] ?? "#64748B" }}
              >
                {g.priority}
              </div>
              {/* Left bar */}
              <div
                className="w-1 self-stretch rounded flex-shrink-0"
                style={{ background: SEVERITY_BAR[g.severity] ?? "#64748B" }}
              />
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-medium text-foreground">{g.gap}</p>
                  <span className={`pill text-[9px] flex-shrink-0 ${SEVERITY_STYLE[g.severity] ?? ""}`}>
                    {g.severity}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Affects: {g.impact}
                </p>
                <p className="text-[10px] text-[#1E40AF] mt-0.5">
                  How to get it: {g.how}
                </p>
              </div>
              {/* Count badge */}
              {g.count > 0 && (
                <div className="flex-shrink-0 text-right">
                  <p className="text-[14px] font-semibold text-muted-foreground">{g.count}</p>
                  <p className="text-[8px] text-muted-foreground">records</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
