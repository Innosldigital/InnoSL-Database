import { getEquityDashboard } from "@/lib/queries";
import { fmtNum, fmtPct }     from "@/lib/utils";

export async function PeopleStats() {
  const equity = await getEquityDashboard();

  const stats = [
    { label:"Total",          value: fmtNum(equity.total_beneficiaries),  colour:"#2D1B69" },
    { label:"Female",         value: fmtNum(equity.female_beneficiaries),  colour:"#EC4899" },
    { label:"Girls (<18)",    value: fmtNum(equity.girls_under_18),        colour:"#8B5CF6" },
    { label:"Youth (18–35)",  value: fmtNum(equity.youth_beneficiaries),   colour:"#38BDF8" },
    { label:"Aged (60+)",     value: fmtNum(equity.aged_beneficiaries),    colour:"#64748B" },
    { label:"Repeat",         value: fmtNum(equity.repeat_beneficiaries),  colour:"#22C55E" },
    { label:"% Female",       value: fmtPct(equity.pct_female),            colour:"#EC4899" },
  ];

  return (
    <div className="isl-card">
      <div className="grid grid-cols-7">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="text-center py-3 border-r border-border last:border-r-0 relative"
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px] rounded-t-sm"
              style={{ background: s.colour }}
            />
            <p className="text-[16px] font-semibold mt-1" style={{ color: s.colour }}>{s.value}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
