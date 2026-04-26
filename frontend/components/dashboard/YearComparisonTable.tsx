"use client";
import { useState } from "react";
import { fmtNum, fmtUSD, getPillClass, cn } from "@/lib/utils";

interface KpiRow {
  year: number; events: number; total_beneficiaries: number;
  female_beneficiaries: number; pct_female: number; pitches: number;
  female_pitches: number; prizes_usd: number; training_participants: number;
}

interface Props { data: KpiRow[] }

const METRICS = [
  { key: "events",               label: "Events run",         format: fmtNum,  colour: "#2D1B69" },
  { key: "total_beneficiaries",  label: "Beneficiaries",      format: fmtNum,  colour: "#38BDF8" },
  { key: "female_beneficiaries", label: "Female beneficiaries",format: fmtNum, colour: "#EC4899" },
  { key: "pct_female",           label: "% Female",           format: (v: number) => `${v ?? 0}%`, colour: "#EC4899" },
  { key: "pitches",              label: "Pitches",            format: fmtNum,  colour: "#4A2FA0" },
  { key: "female_pitches",       label: "Female pitchers",    format: fmtNum,  colour: "#9D174D" },
  { key: "prizes_usd",           label: "Prizes (USD)",       format: fmtUSD,  colour: "#C9821A" },
  { key: "training_participants",label: "People trained",     format: fmtNum,  colour: "#22C55E" },
];

export function YearComparisonTable({ data }: Props) {
  const [compareA, setCompareA] = useState<number | null>(null);
  const [compareB, setCompareB] = useState<number | null>(null);

  const years = [...new Set(data.map(r => r.year))].sort((a, b) => b - a);

  // Aggregate per year across all programme types
  const byYear = years.map(yr => {
    const rows = data.filter(r => r.year === yr);
    const agg: Record<string, number> = { year: yr };
    for (const m of METRICS) {
      if (m.key === "pct_female") {
        const tot = rows.reduce((a, r) => a + ((r as any).total_beneficiaries ?? 0), 0);
        const fem = rows.reduce((a, r) => a + ((r as any).female_beneficiaries ?? 0), 0);
        agg[m.key] = tot > 0 ? Math.round((fem / tot) * 100 * 10) / 10 : 0;
      } else {
        agg[m.key] = rows.reduce((a, r) => a + ((r as any)[m.key] ?? 0), 0);
      }
    }
    return agg;
  });

  const rowA = compareA ? byYear.find(r => r.year === compareA) : null;
  const rowB = compareB ? byYear.find(r => r.year === compareB) : null;

  function delta(a: number, b: number): React.ReactNode {
    if (!a || !b) return null;
    const diff = a - b;
    const pct  = b > 0 ? Math.round((diff / b) * 100) : null;
    return (
      <span className={`text-[9px] font-medium ${diff >= 0 ? "text-green-700" : "text-red-600"}`}>
        {diff >= 0 ? "+" : ""}{fmtNum(diff)}
        {pct !== null && <span className="ml-0.5 opacity-70">({diff >= 0 ? "+" : ""}{pct}%)</span>}
      </span>
    );
  }

  return (
    <div className="isl-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <p className="text-[12px] font-medium">Year-on-year KPI comparison — all programmes</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Compare:</span>
          <select
            value={compareA ?? ""}
            onChange={e => setCompareA(e.target.value ? Number(e.target.value) : null)}
            className="px-2 py-1 text-[10px] border border-border rounded-md bg-white focus:outline-none"
          >
            <option value="">Year A</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-[10px] text-muted-foreground">vs</span>
          <select
            value={compareB ?? ""}
            onChange={e => setCompareB(e.target.value ? Number(e.target.value) : null)}
            className="px-2 py-1 text-[10px] border border-border rounded-md bg-white focus:outline-none"
          >
            <option value="">Year B</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-2 text-left text-[9px] font-medium uppercase tracking-wide text-muted-foreground w-[140px]">
                Metric
              </th>
              {byYear.map(r => (
                <th key={r.year}
                  className={cn(
                    "px-3 py-2 text-center text-[10px] font-medium cursor-pointer transition-colors",
                    r.year === compareA ? "text-[#2D1B69] bg-[#EDE8F8]" :
                    r.year === compareB ? "text-[#1E40AF] bg-[#DBEAFE]" :
                    "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    if (!compareA || compareA === r.year) setCompareA(r.year);
                    else if (!compareB || compareB === r.year) setCompareB(r.year);
                  }}
                >
                  {r.year}
                  {r.year === compareA && <div className="text-[8px] font-normal opacity-70">Year A</div>}
                  {r.year === compareB && <div className="text-[8px] font-normal opacity-70">Year B</div>}
                </th>
              ))}
              {rowA && rowB && (
                <th className="px-3 py-2 text-center text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                  Δ Change
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {METRICS.map(m => (
              <tr key={m.key} className="border-b border-border hover:bg-muted/20">
                <td className="px-4 py-2 text-[10px] text-muted-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.colour }} />
                    {m.label}
                  </div>
                </td>
                {byYear.map(r => (
                  <td key={r.year}
                    className={cn(
                      "px-3 py-2 text-center font-medium",
                      r.year === compareA ? "bg-[#EDE8F8]/50 text-[#2D1B69]" :
                      r.year === compareB ? "bg-[#DBEAFE]/50 text-[#1E40AF]" :
                      r[m.key] === 0 ? "text-muted-foreground/50" : "text-foreground"
                    )}
                  >
                    {r[m.key] ? m.format(r[m.key]) : "—"}
                  </td>
                ))}
                {rowA && rowB && (
                  <td className="px-3 py-2 text-center">
                    {delta(rowA[m.key], rowB[m.key])}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t border-border bg-muted/20">
        <p className="text-[9px] text-muted-foreground">
          Click any year column to set as comparison year A or B. 
          Gaps (—) indicate data not yet imported for that year.
        </p>
      </div>
    </div>
  );
}
