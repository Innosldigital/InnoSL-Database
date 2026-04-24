"use client";
import Link                                                      from "next/link";
import type { Pitch }                                            from "@/types";
import { fmtDate, getInitials, getAvatarColour, getPillClass, cn } from "@/lib/utils";

interface Props { pitches: Pitch[] }

export function PitchesTable({ pitches }: Props) {
  return (
    <div className="isl-card">
      <div className="px-4 py-2.5 border-b border-border">
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">{pitches.length}</span> pitch records found
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              {["Founder","Business / idea","Event","Year","Category","Score","Rank","Prize","Flags"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pitches.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">No pitches found.</td></tr>
            ) : pitches.map(p => {
              const { bg, text } = getAvatarColour(p.person?.full_name ?? "?");
              return (
                <tr key={p.pitch_id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
                        style={{ background: bg, color: text }}>
                        {getInitials(p.person?.full_name ?? "?")}
                      </div>
                      <Link href={`/people/${p.person_id}`} className="text-[11px] font-medium text-[#1E40AF] hover:underline truncate max-w-[120px]">
                        {p.person?.full_name ?? "—"}
                      </Link>
                    </div>
                  </td>
                  <td className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                    {p.organisation?.name ?? p.idea_description?.slice(0,40) ?? "—"}
                  </td>
                  <td><span className={`pill ${getPillClass(p.event?.event_type ?? "")}`}>{p.event?.event_type ?? "—"}</span></td>
                  <td className="text-[11px] text-muted-foreground">{p.event?.edition_year ?? "—"}</td>
                  <td className="text-[11px] text-muted-foreground">{p.category ?? "—"}</td>
                  <td className="text-[11px] text-center font-medium">{p.score ?? "—"}</td>
                  <td className="text-[11px] text-center">{p.rank ? `#${p.rank}` : "—"}</td>
                  <td className="text-[11px] text-center">
                    {p.prize_amount
                      ? <span className="pill bg-green-100 text-green-800">${Number(p.prize_amount).toLocaleString()}</span>
                      : "—"}
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {p.winner_flag        && <span className="pill bg-green-100 text-green-800">Winner</span>}
                      {p.first_female_flag  && <span className="pill bg-pink-100 text-pink-800">1st ♀</span>}
                      {p.repeat_pitcher_flag && <span className="pill bg-[#EDE8F8] text-[#4A2FA0]">Repeat</span>}
                      {p.person?.is_woman   && <span className="pill pill-female">F</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
