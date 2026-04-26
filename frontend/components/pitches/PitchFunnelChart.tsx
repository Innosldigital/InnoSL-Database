"use client";
import { fmtNum, fmtUSD, getPillClass } from "@/lib/utils";

interface FunnelRow {
  event_name: string; event_type: string; year: number; theme: string;
  funder: string; applications_received: number; total_pitched: number;
  female_pitched: number; male_pitched: number; winners: number;
  finalists: number; first_female_wins: number; total_prizes_usd: number;
  total_attended: number; categories: string; sectors: string;
}

interface Props { data: FunnelRow[]; selectedYear?: number; selectedType?: string; }

export function PitchFunnelChart({ data, selectedYear, selectedType }: Props) {
  const filtered = data.filter(r =>
    (!selectedYear || r.year === selectedYear) &&
    (!selectedType || r.event_type === selectedType)
  );

  if (!filtered.length) {
    return (
      <div className="isl-card p-8 text-center text-muted-foreground text-sm">
        No pitch data for selected filters. Import pitches CSV to populate.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {filtered.map((r, i) => {
        const convRate = r.applications_received > 0
          ? Math.round((r.total_pitched / r.applications_received) * 100)
          : null;
        const femalePct = r.total_pitched > 0
          ? Math.round((r.female_pitched / r.total_pitched) * 100)
          : 0;
        const maxBar = r.applications_received || r.total_pitched || 1;

        return (
          <div key={i} className="isl-card overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`pill ${getPillClass(r.event_type)}`}>{r.event_type}</span>
                  <span className="text-[12px] font-medium text-foreground">{r.event_name}</span>
                  {r.first_female_wins > 0 && (
                    <span className="pill bg-pink-100 text-pink-800">♀ first</span>
                  )}
                </div>
                {r.theme && <p className="text-[10px] text-muted-foreground">{r.theme}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {r.funder && <span className="pill bg-[#EDE8F8] text-[#4A2FA0]">{r.funder}</span>}
                <span className="text-[11px] font-medium text-muted-foreground">{r.year}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-0">
              {/* Funnel */}
              <div className="px-4 py-3 border-r border-border">
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-3 font-medium">
                  Pitch pipeline funnel
                </p>

                {[
                  {
                    label: "Applications received",
                    val: r.applications_received || "—",
                    width: 100,
                    color: "#2D1B69",
                    note: r.applications_received ? null : "Add to event record",
                  },
                  {
                    label: "Pitched live",
                    val: r.total_pitched,
                    width: r.applications_received
                      ? Math.max(8, (r.total_pitched / maxBar) * 100)
                      : 100,
                    color: "#4A2FA0",
                    note: convRate ? `${convRate}% acceptance` : null,
                  },
                  {
                    label: "Finalists",
                    val: r.finalists || "—",
                    width: r.finalists
                      ? Math.max(5, (r.finalists / maxBar) * 100)
                      : 30,
                    color: "#7B5EA7",
                    note: null,
                  },
                  {
                    label: "Winners",
                    val: r.winners || "—",
                    width: r.winners
                      ? Math.max(4, (r.winners / maxBar) * 100)
                      : 10,
                    color: "#38BDF8",
                    note: r.total_prizes_usd > 0 ? fmtUSD(r.total_prizes_usd) : null,
                  },
                ].map((step, j) => (
                  <div key={j} className="flex items-center gap-2 mb-2">
                    <div
                      className="h-7 rounded-md flex items-center px-2.5 text-[10px] font-medium text-white flex-shrink-0 transition-all"
                      style={{ width: `${step.width}%`, background: step.color, minWidth: 48 }}
                    >
                      {step.label}
                    </div>
                    <span className="text-[11px] font-medium text-foreground flex-shrink-0">
                      {step.val}
                    </span>
                    {step.note && (
                      <span className="text-[9px] text-muted-foreground">{step.note}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="px-4 py-3">
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-3 font-medium">
                  Gender & attendance
                </p>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: "Female pitchers", val: r.female_pitched, color: "#EC4899" },
                    { label: "Male pitchers",   val: r.male_pitched,   color: "#38BDF8" },
                    { label: "Total attended",  val: r.total_attended || "—", color: "#22C55E" },
                    { label: "Prizes (USD)",    val: r.total_prizes_usd > 0 ? fmtUSD(r.total_prizes_usd) : "—", color: "#C9821A" },
                  ].map((m) => (
                    <div key={m.label} className="bg-muted/30 rounded-lg p-2">
                      <p className="text-[13px] font-semibold" style={{ color: m.color }}>{m.val}</p>
                      <p className="text-[9px] text-muted-foreground">{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Female % bar */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] text-muted-foreground">Female pitcher rate</span>
                    <span className="text-[9px] font-medium text-pink-700">{femalePct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted/40 rounded-full">
                    <div
                      className="h-1.5 rounded-full bg-pink-400 transition-all"
                      style={{ width: `${femalePct}%` }}
                    />
                  </div>
                </div>

                {r.sectors && (
                  <div className="mt-3">
                    <p className="text-[9px] text-muted-foreground mb-1">Sectors</p>
                    <div className="flex flex-wrap gap-1">
                      {r.sectors.split(", ").filter(Boolean).map((s) => (
                        <span key={s} className="pill bg-muted/50 text-muted-foreground">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
