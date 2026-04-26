"use client";
import { useState }      from "react";
import Link              from "next/link";
import { getInitials, getAvatarColour, fmtUSD, cn } from "@/lib/utils";

interface JourneyRow {
  person_id: string; isl_ref: string; full_name: string;
  gender: string; is_woman: boolean; is_youth: boolean;
  location: string; journey_score: number;
  has_pitched: boolean; has_trained: boolean;
  has_incubated: boolean; has_grant: boolean; has_diagnostic: boolean;
  pitch_count: number; cohort_count: number; grant_count: number;
  total_usd_received: number; business_name: string; sector: string;
}

interface StatsRow {
  total: number; score5: number; score4: number; score3: number;
  has_pitched: number; has_grant: number; has_incubated: number; female_multi: number;
}

interface Props { data: JourneyRow[]; stats: StatsRow }

const STEPS = [
  { key: "has_pitched",    label: "Pitched",     icon: "🎤", colour: "#2D1B69" },
  { key: "has_trained",    label: "Trained",     icon: "📚", colour: "#38BDF8" },
  { key: "has_incubated",  label: "Incubated",   icon: "🚀", colour: "#22C55E" },
  { key: "has_grant",      label: "Grant",       icon: "💰", colour: "#C9821A" },
  { key: "has_diagnostic", label: "Diagnosed",   icon: "📊", colour: "#8B5CF6" },
];

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <div
          key={i}
          className="h-2 flex-1 rounded-sm transition-colors"
          style={{ background: i <= score ? "#2D1B69" : "#EDE8F8" }}
        />
      ))}
    </div>
  );
}

export function BeneficiaryJourneyTracker({ data, stats }: Props) {
  const [filter, setFilter] = useState<"all"|"women"|"multi">("all");
  const [minScore, setMinScore] = useState(1);

  const filtered = data.filter(r => {
    if (filter === "women" && !r.is_woman) return false;
    if (filter === "multi" && r.journey_score < 2) return false;
    if (r.journey_score < minScore) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-2.5">
        {[
          { label: "Completed full journey (5/5)", value: stats.score5, colour: "#2D1B69", sub: "Flagship case studies" },
          { label: "4 of 5 steps completed",       value: stats.score4, colour: "#4A2FA0", sub: "Near-complete journeys" },
          { label: "Women with multi-programme",   value: stats.female_multi, colour: "#EC4899", sub: "Gender equity depth" },
          { label: "Received capital + pitched",   value: stats.has_grant, colour: "#C9821A", sub: "Pitch-to-investment" },
        ].map(k => (
          <div key={k.label} className="isl-card px-4 py-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: k.colour }} />
            <p className="text-[20px] font-semibold mt-1" style={{ color: k.colour }}>{k.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{k.label}</p>
            <p className="text-[9px] text-muted-foreground/70 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="isl-card px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <span className="text-[11px] font-medium text-muted-foreground">Filter:</span>
        {(["all","women","multi"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1 rounded-full text-[10px] border font-medium transition-colors",
              filter === f
                ? "bg-[#2D1B69] text-white border-[#2D1B69]"
                : "bg-white text-muted-foreground border-border hover:bg-[#EDE8F8]"
            )}>
            {f === "all" ? "All beneficiaries" : f === "women" ? "Women only" : "Multi-programme"}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] text-muted-foreground">Min journey score:</span>
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setMinScore(s)}
              className={cn("w-6 h-6 rounded-full text-[10px] font-medium border transition-colors",
                minScore === s
                  ? "bg-[#2D1B69] text-white border-[#2D1B69]"
                  : "bg-white text-muted-foreground border-border hover:bg-[#EDE8F8]"
              )}>
              {s}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">{filtered.length} showing</span>
      </div>

      {/* Journey steps legend */}
      <div className="isl-card px-4 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[10px] font-medium text-muted-foreground">Journey steps:</span>
          {STEPS.map(s => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]"
                style={{ background: s.colour }}>
                {s.icon}
              </div>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Journey table */}
      <div className="isl-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-[11px] text-muted-foreground">
            No beneficiaries match your filters. Import more data to populate journey tracking.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2 text-left text-[9px] font-medium uppercase tracking-wide text-muted-foreground w-[20%]">Beneficiary</th>
                  <th className="px-3 py-2 text-left text-[9px] font-medium uppercase tracking-wide text-muted-foreground w-[18%]">Business</th>
                  {STEPS.map(s => (
                    <th key={s.key} className="px-2 py-2 text-center text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                      {s.icon}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center text-[9px] font-medium uppercase tracking-wide text-muted-foreground">Score</th>
                  <th className="px-3 py-2 text-right text-[9px] font-medium uppercase tracking-wide text-muted-foreground">Capital</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 30).map(r => {
                  const { bg, text } = getAvatarColour(r.full_name);
                  return (
                    <tr key={r.person_id} className="border-b border-border hover:bg-[#F5F2FD] cursor-pointer">
                      <td className="px-4 py-2.5">
                        <Link href={`/people/${r.person_id}`} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
                            style={{ background: bg, color: text }}>
                            {getInitials(r.full_name)}
                          </div>
                          <div>
                            <p className="font-medium text-[11px] text-foreground leading-tight">{r.full_name}</p>
                            <div className="flex gap-1 mt-0.5">
                              {r.is_woman && <span className="pill bg-pink-100 text-pink-800 text-[8px]">F</span>}
                              {r.is_youth && <span className="pill bg-blue-100 text-blue-800 text-[8px]">Y</span>}
                              {r.location && <span className="text-[9px] text-muted-foreground">{r.location}</span>}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-[10px] text-muted-foreground truncate max-w-[140px]">
                        {r.business_name ?? "—"}
                        {r.sector && <span className="block text-[9px] text-muted-foreground/70">{r.sector}</span>}
                      </td>
                      {STEPS.map(s => (
                        <td key={s.key} className="px-2 py-2.5 text-center">
                          {(r as any)[s.key]
                            ? <span className="text-[14px]">✓</span>
                            : <span className="text-muted-foreground/30 text-[11px]">—</span>
                          }
                        </td>
                      ))}
                      <td className="px-3 py-2.5">
                        <ScoreBar score={r.journey_score} />
                        <p className="text-[9px] text-center text-muted-foreground mt-0.5">{r.journey_score}/5</p>
                      </td>
                      <td className="px-3 py-2.5 text-right text-[10px] font-medium text-green-700">
                        {r.total_usd_received > 0 ? fmtUSD(r.total_usd_received) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
