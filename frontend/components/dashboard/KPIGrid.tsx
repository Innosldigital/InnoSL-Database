import { fmtNum, fmtUSD, fmtPct } from "@/lib/utils";
import type { EquityDashboard }    from "@/types";
import Link from "next/link";

interface Props {
  equity:           EquityDashboard;
  eventsCount:      number;
  totalUSD:         number;
  jobsCreated?:     number;
  activeYear?:      number;
  activeProgramme?: string;
}

export function KPIGrid({ equity, eventsCount, totalUSD, jobsCreated, activeYear, activeProgramme }: Props) {
  const filterTag = [activeYear, activeProgramme].filter(Boolean).join(" · ");
  const scope     = filterTag || "All programmes 2018–2026";

  const kpis = [
    {
      label: "Total beneficiaries",
      value: fmtNum(equity.total_beneficiaries),
      delta: filterTag ? `${scope}` : "All programmes 2018–2026",
      deltaColor: "text-green-700",
      accent: "#2D1B69", bar: Math.min((equity.total_beneficiaries / 1500) * 100, 100), barColor: "#2D1B69",
      href: "/people",
    },
    {
      label: "Events & programmes run",
      value: fmtNum(eventsCount),
      delta: filterTag
        ? `${scope}`
        : eventsCount > 0 ? "FPN · FIW · GEW · OSVP and more" : "No events imported yet",
      deltaColor: "text-[#1E40AF]",
      accent: "#38BDF8", bar: Math.min((eventsCount / 60) * 100, 100), barColor: "#38BDF8",
      href: "/events",
    },
    {
      label: "Female beneficiaries",
      value: fmtPct(equity.pct_female),
      delta: equity.female_beneficiaries > 0
        ? `${fmtNum(equity.female_beneficiaries)} women & girls`
        : "No data yet",
      deltaColor: "text-pink-700",
      accent: "#EC4899", bar: equity.pct_female ?? 0, barColor: "#EC4899",
      href: "/people?is_woman=true",
    },
    {
      label: "Capital deployed",
      value: totalUSD > 0 ? fmtUSD(totalUSD) : "—",
      delta: totalUSD > 0
        ? filterTag ? `${scope}` : "grants · prizes · seed"
        : "No grants imported yet",
      deltaColor: "text-green-700",
      accent: "#22C55E", bar: Math.min((totalUSD / 500000) * 100, 100), barColor: "#22C55E",
      href: "/grants",
    },
    {
      label: "Jobs created",
      value: jobsCreated != null && jobsCreated > 0 ? fmtNum(jobsCreated) : "—",
      delta: jobsCreated != null && jobsCreated > 0 ? "direct & indirect" : "Track via grants & M&E",
      deltaColor: "text-amber-700",
      accent: "#C9821A", bar: Math.min(((jobsCreated ?? 0) / 1000) * 100, 100), barColor: "#C9821A",
      href: "/reports",
    },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      {filterTag && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] text-[#7B5EA7] font-medium uppercase tracking-wide">Filtered view:</span>
          <span className="px-2 py-0.5 rounded-full bg-[#EDE8F8] text-[10px] font-medium text-[#2D1B69]">{scope}</span>
          <a href="/dashboard" className="text-[10px] text-muted-foreground hover:text-[#2D1B69] underline underline-offset-2">
            Clear filter
          </a>
        </div>
      )}
      <div className="grid grid-cols-5 gap-2.5">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="stat-card group">
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: k.accent }} />
            <p className="text-[10px] text-muted-foreground mt-1 mb-1.5">{k.label}</p>
            <p className="text-[22px] font-semibold text-foreground leading-none">{k.value}</p>
            <p className={`text-[10px] mt-1 ${k.deltaColor}`}>{k.delta}</p>
            <div className="mt-2 h-[3px] rounded-full bg-[#EDE8F8]">
              <div className="h-full rounded-full transition-all" style={{ width:`${k.bar}%`, background:k.barColor }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
