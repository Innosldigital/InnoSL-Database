import { fmtDate, getPillClass } from "@/lib/utils";
import Link from "next/link";

interface Props { person: any }

export function PersonTimeline({ person }: Props) {
  const attendance: any[] = person.attendance ?? [];
  const pitches: any[] = person.pitch ?? [];

  type Entry = { date: string; title: string; type: string; meta: string; colour: string; href?: string; };
  const entries: Entry[] = [
    ...attendance.map((a: any) => ({
      date: a.event?.date_start ?? "",
      title: a.event?.name ?? "Event",
      type: a.role_at_event,
      meta: `${a.event?.event_type ?? ""} ${a.event?.edition_year ?? ""}`,
      colour: "#EDE8F8",
      href: a.event_id ? `/events/${a.event_id}` : undefined,
    })),
    ...pitches.map((p: any) => ({
      date: p.event?.date_start ?? "",
      title: `Pitched: ${p.organisation?.name ?? p.idea_description?.slice(0, 40) ?? "Idea"}`,
      type: p.winner_flag ? "Winner" : p.finalist_flag ? "Finalist" : "Pitcher",
      meta: `${p.event?.event_type ?? ""} ${p.event?.edition_year ?? ""}`,
      colour: p.winner_flag ? "#D1FAE5" : "#FCE7F3",
      href: p.pitch_id ? `/pitches/${p.pitch_id}` : undefined,
    })),
  ].sort((a, b) => (b.date > a.date ? 1 : -1));

  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Engagement timeline</p>
        <span className="text-[10px] text-muted-foreground">{entries.length} events total</span>
      </div>
      <div className="px-4 py-3">
        {entries.length === 0 ? (
          <p className="text-[11px] text-muted-foreground py-4 text-center">No engagement records yet.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-[14px] top-4 bottom-4 w-px bg-border" />
            <div className="flex flex-col gap-0">
              {entries.map((e, i) => (
                <div key={i} className="flex gap-3 pb-4 relative">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0 z-10 border-2 border-white"
                    style={{ background: e.colour }}
                  >
                    {e.type.charAt(0)}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-[11px] font-medium text-foreground">{e.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`pill ${getPillClass(e.meta.split(" ")[0] as any)}`}>{e.meta}</span>
                      <span className="text-[10px] text-muted-foreground">{fmtDate(e.date)}</span>
                    </div>
                  </div>
                  {e.href && (
                    <Link href={e.href} className="text-[10px] text-[#1E40AF] pt-1 hover:underline flex-shrink-0">
                      View
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2 p-3 border border-dashed border-[#7B5EA7] rounded-lg bg-[#F5F2FD]">
          <p className="text-[11px] text-[#7B5EA7] font-medium mb-1">Next engagement not yet recorded</p>
          <p className="text-[10px] text-[#9490a8]">Candidate for upcoming FIW or FPN outreach.</p>
          <Link
            href={`/people/${person.person_id}/outreach`}
            className="inline-block mt-2 px-3 py-1.5 bg-[#2D1B69] text-white rounded-lg text-[10px] font-medium hover:bg-[#4A2FA0] transition-colors"
          >
            Draft invite
          </Link>
        </div>
      </div>
    </div>
  );
}
