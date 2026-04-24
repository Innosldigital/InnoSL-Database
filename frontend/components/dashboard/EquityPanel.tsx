import type { EquityDashboard } from "@/types";
import { fmtNum, fmtPct }       from "@/lib/utils";

interface Props {
  equity:              EquityDashboard;
  womenLedPct?:        number;
  capitalToWomenPct?:  number;
}

export function EquityPanel({ equity, womenLedPct = 0, capitalToWomenPct = 0 }: Props) {
  const pct = (n: number) => equity.total_beneficiaries > 0
    ? Math.round((n / equity.total_beneficiaries) * 100) : 0;

  const rows = [
    { label: "Women beneficiaries",   value: fmtPct(equity.pct_female),          bar: equity.pct_female,              color: "#EC4899" },
    { label: "Youth (15–35 yrs)",     value: fmtPct(pct(equity.youth_beneficiaries)), bar: pct(equity.youth_beneficiaries), color: "#38BDF8" },
    { label: "Girls (under 18)",      value: fmtNum(equity.girls_under_18),       bar: pct(equity.girls_under_18),     color: "#8B5CF6" },
    { label: "Aged (60+)",            value: fmtNum(equity.aged_beneficiaries),   bar: pct(equity.aged_beneficiaries), color: "#64748B" },
    { label: "PWD (disability)",      value: fmtNum(equity.pwd_beneficiaries),    bar: pct(equity.pwd_beneficiaries),  color: "#F97316" },
    { label: "Outside Freetown",      value: fmtPct(pct(equity.regional_beneficiaries)), bar: pct(equity.regional_beneficiaries), color: "#22C55E" },
    { label: "Women-led businesses",  value: fmtPct(womenLedPct),                bar: womenLedPct,                    color: "#C9821A" },
    { label: "Capital to women",      value: fmtPct(capitalToWomenPct),          bar: capitalToWomenPct,              color: "#2D1B69" },
  ];

  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Equity intelligence</p>
        <a href="/reports/equity" className="text-[10px] text-[#1E40AF] hover:underline">Full report →</a>
      </div>
      <div className="px-4 py-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2.5 py-2 border-b border-border last:border-0">
            <span className="text-[11px] text-muted-foreground w-[130px] flex-shrink-0">{r.label}</span>
            <div className="equity-bar-bg">
              <div className="equity-bar" style={{ width: `${Math.min(r.bar, 100)}%`, background: r.color }} />
            </div>
            <span className="text-[11px] font-medium text-foreground w-9 text-right flex-shrink-0">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
