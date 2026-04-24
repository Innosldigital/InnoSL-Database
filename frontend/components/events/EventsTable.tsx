"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Event } from "@/types";
import { fmtDate, getPillClass, cn } from "@/lib/utils";

interface Props { events: Event[]; total: number; page: number; perPage: number; }

export function EventsTable({ events, total, page, perPage }: Props) {
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
          Showing <span className="font-medium text-foreground">{events.length}</span> of{" "}
          <span className="font-medium text-foreground">{total}</span> events
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              {["Event name", "Type", "Year", "Date", "Venue", "Registered", "Attended", "Female", "Funder"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">No events found.</td></tr>
            ) : events.map((e) => (
              <tr key={e.event_id}>
                <td>
                  <Link href={`/events/${e.event_id}`} className="font-medium text-[#1E40AF] hover:underline text-[11px]">
                    {e.name}
                  </Link>
                </td>
                <td><span className={`pill ${getPillClass(e.event_type)}`}>{e.event_type}</span></td>
                <td className="text-[11px] text-muted-foreground">{e.edition_year}</td>
                <td className="text-[11px] text-muted-foreground">{fmtDate(e.date_start)}</td>
                <td className="text-[11px] text-muted-foreground truncate max-w-[120px]">{e.venue ?? "-"}</td>
                <td className="text-[11px] text-center">{e.total_registered || "-"}</td>
                <td className="text-[11px] text-center font-medium">{e.total_attended || "-"}</td>
                <td className="text-[11px] text-center text-pink-700 font-medium">{e.female_count || "-"}</td>
                <td className="text-[11px] text-muted-foreground truncate max-w-[100px]">{e.funder ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
          <p className="text-[11px] text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i + 1).map((n) => (
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
