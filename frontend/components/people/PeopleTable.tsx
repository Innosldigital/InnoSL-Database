"use client";
import Link                  from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Person }       from "@/types";
import { getInitials, getAvatarColour, fmtDate, getPillClass, getGenderPill, getScoreColour, cn } from "@/lib/utils";

interface Props {
  people:   Person[];
  total:    number;
  page:     number;
  perPage:  number;
}

const COLS = [
  { key: "full_name",            label: "Name",         w: "w-[22%]" },
  { key: "gender",               label: "Gender",       w: "w-[8%]" },
  { key: "age_group",            label: "Age group",    w: "w-[9%]" },
  { key: "location",             label: "Location",     w: "w-[10%]" },
  { key: "first_programme",      label: "Programme",    w: "w-[10%]" },
  { key: "first_engagement_date",label: "First engaged",w: "w-[11%]" },
  { key: "total_events_attended",label: "Events",       w: "w-[7%]" },
  { key: "completeness_score",   label: "Score",        w: "w-[8%]" },
  { key: "equity",               label: "Flags",        w: "w-[15%]" },
];

export function PeopleTable({ people, total, page, perPage }: Props) {
  const router    = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / perPage);

  function getPageHref(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    return `?${params.toString()}`;
  }

  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <p className="text-[11px] text-muted-foreground">
          Showing <span className="font-medium text-foreground">{people.length}</span> of{" "}
          <span className="font-medium text-foreground">{total.toLocaleString()}</span> people
        </p>
        <p className="text-[10px] text-muted-foreground">Click any row to view full profile</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.key} className={c.w}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                  No people found matching your filters.
                </td>
              </tr>
            ) : (
              people.map((p) => {
                const { bg, text } = getAvatarColour(p.full_name);
                return (
                  <tr
                    key={p.person_id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/people/${p.person_id}`)}
                  >
                    {/* Name */}
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
                          style={{ background: bg, color: text }}
                        >
                          {getInitials(p.full_name)}
                        </div>
                        <span className="font-medium text-[11px] truncate">{p.full_name}</span>
                      </div>
                    </td>
                    {/* Gender */}
                    <td>
                      <span className={`pill ${getGenderPill(p.gender)}`}>{p.gender}</span>
                    </td>
                    {/* Age group */}
                    <td className="text-[11px] text-muted-foreground">{p.age_group}</td>
                    {/* Location */}
                    <td className="text-[11px] text-muted-foreground truncate max-w-[100px]">{p.location ?? "—"}</td>
                    {/* Programme */}
                    <td>
                      {p.first_programme
                        ? <span className={`pill ${getPillClass(p.first_programme as any)}`}>{p.first_programme}</span>
                        : <span className="text-[10px] text-muted-foreground">—</span>
                      }
                    </td>
                    {/* First engaged */}
                    <td className="text-[11px] text-muted-foreground">{fmtDate(p.first_engagement_date)}</td>
                    {/* Events */}
                    <td className="text-[11px] font-medium text-center">{p.total_events_attended}</td>
                    {/* Score */}
                    <td>
                      <span className={`text-[11px] font-medium ${getScoreColour(p.completeness_score)}`}>
                        {p.completeness_score}%
                      </span>
                    </td>
                    {/* Equity flags */}
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {p.is_woman           && <span className="pill pill-female">W</span>}
                        {p.is_youth           && <span className="pill pill-youth">Y</span>}
                        {p.is_girl            && <span className="pill pill-female text-[8px]">Girl</span>}
                        {p.is_aged            && <span className="pill bg-slate-100 text-slate-700">60+</span>}
                        {p.is_repeat_beneficiary && <span className="pill pill-winner">Rep</span>}
                        {p.is_outside_freetown   && <span className="pill bg-green-100 text-green-800">Reg</span>}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
          <p className="text-[11px] text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={getPageHref(n)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] border transition-colors",
                  n === page
                    ? "bg-[#2D1B69] text-white border-[#2D1B69]"
                    : "bg-white text-muted-foreground border-border hover:bg-[#EDE8F8]"
                )}
              >
                {n}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
