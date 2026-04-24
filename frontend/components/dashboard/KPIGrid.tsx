import { fmtNum, fmtUSD, fmtPct } from "@/lib/utils";
import type { EquityDashboard }   from "@/types";
import Link from "next/link";

interface Props {
  equity:      EquityDashboard;
  eventsCount: number;
  totalUSD:    number;
}

export function KPIGrid({ equity, eventsCount, totalUSD }: Props) {
  const kpis = [
    {
      label: "Total beneficiaries",
      value: fmtNum(equity.total_beneficiaries),
      delta: "+178 this year",
      deltaColor: "text-green-700",
      accent: "#2D1B69",
      bar: 74,
      barColor: "#2D1B69",
      href: "/people",
    },
    {
      label: "Events & programmes run",
      value: fmtNum(eventsCount),
      delta: "across 9 activity types",
      deltaColor: "text-[#1E40AF]",
      accent: "#38BDF8",
      bar: 60,
      barColor: "#38BDF8",
      href: "/events",
    },
    {
      label: "Female beneficiaries",
      value: fmtPct(equity.pct_female),
      delta: `${fmtNum(equity.female_beneficiaries)} women & girls`,
      deltaColor: "text-pink-700",
      accent: "#EC4899",
      bar: equity.pct_female,
      barColor: "#EC4899",
      href: "/people?is_woman=true",
    },
    {
      label: "Capital deployed",
      value: fmtUSD(totalUSD),
      delta: "grants · prizes · seed",
      deltaColor: "text-green-700",
      accent: "#22C55E",
      bar: 52,
      barColor: "#22C55E",
      href: "/grants",
    },
    {
      label: "Jobs created",
      value: "620+",
      delta: "direct & indirect",
      deltaColor: "text-amber-700",
      accent: "#C9821A",
      bar: 45,
      barColor: "#C9821A",
      href: "/reports",
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-2.5">
      {kpis.map((k) => (
        <Link key={k.label} href={k.href} className="stat-card group">
          <div
            className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
            style={{ background: k.accent }}
          />
          <p className="text-[10px] text-muted-foreground mt-1 mb-1.5">{k.label}</p>
          <p className="text-[22px] font-semibold text-foreground leading-none">{k.value}</p>
          <p className={`text-[10px] mt-1 ${k.deltaColor}`}>{k.delta}</p>
          <div className="mt-2 h-[3px] rounded-full bg-[#EDE8F8]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${k.bar}%`, background: k.barColor }}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
