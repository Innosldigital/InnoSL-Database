import { notFound } from "next/navigation";
import { getEventById } from "@/lib/queries";
import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { fmtDate, fmtNum, fmtPct } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const event = await getEventById(params.id);
    return { title: event?.name ?? "Event" };
  } catch {
    return { title: "Event" };
  }
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  let event;
  try {
    event = await getEventById(params.id);
  } catch {
    notFound();
  }

  if (!event) notFound();

  const attendance = event.attendance ?? [];
  const roles = event.event_role ?? [];
  const pitches = event.pitch ?? [];
  const attendedCount = attendance.filter((row: any) => row.attended).length;
  const womenAttended = attendance.filter((row: any) => row.person?.is_woman && row.attended).length;
  const womenPct = attendedCount > 0 ? (womenAttended / attendedCount) * 100 : 0;

  const summary = [
    { label: "Registered", value: fmtNum(event.total_registered ?? attendance.length) },
    { label: "Attended", value: fmtNum(event.total_attended ?? attendedCount) },
    { label: "Female attendance", value: fmtNum(event.female_count ?? womenAttended) },
    { label: "Women share", value: fmtPct(womenPct, 0) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/events" label="Events" ref={event.isl_ref} />

      <PageHeader
        title={event.name}
        subtitle={`${event.event_type} · ${event.programme ?? "Programme not set"} · ${event.edition_year}`}
        actions={[
          { label: "Export CSV", href: "/api/events/export", variant: "secondary" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="flex flex-col gap-4">
          <div className="isl-card p-5">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {summary.map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-white px-4 py-3">
                  <p className="text-[18px] font-semibold text-[#2D1B69]">{item.value}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="isl-card">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[12px] font-medium">Attendance</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    {["Name", "Gender", "Location", "Role", "Attended"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No attendance records found.</td></tr>
                  ) : attendance.map((row: any) => (
                    <tr key={row.attendance_id}>
                      <td className="text-[11px] font-medium">{row.person?.full_name ?? "-"}</td>
                      <td className="text-[11px] text-muted-foreground">{row.person?.gender ?? "-"}</td>
                      <td className="text-[11px] text-muted-foreground">{row.person?.location ?? "-"}</td>
                      <td className="text-[11px] text-muted-foreground">{row.role_at_event ?? "-"}</td>
                      <td className="text-[11px]">{row.attended ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="isl-card">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[12px] font-medium">Pitch submissions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    {["Founder", "Organisation", "Category", "Score", "Rank", "Outcome"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pitches.length === 0 ? (
                    <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">No pitch records linked to this event.</td></tr>
                  ) : pitches.map((pitch: any) => (
                    <tr key={pitch.pitch_id}>
                      <td className="text-[11px] font-medium">{pitch.person?.full_name ?? "-"}</td>
                      <td className="text-[11px] text-muted-foreground">{pitch.organisation?.name ?? "-"}</td>
                      <td className="text-[11px] text-muted-foreground">{pitch.category ?? "-"}</td>
                      <td className="text-[11px] text-muted-foreground">{pitch.score ?? "-"}</td>
                      <td className="text-[11px] text-muted-foreground">{pitch.rank ?? "-"}</td>
                      <td className="text-[11px]">{pitch.winner_flag ? "Winner" : pitch.finalist_flag ? "Finalist" : "Participant"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-3">Event details</p>
            <div className="grid grid-cols-1 gap-3">
              <Detail label="Programme" value={event.programme} />
              <Detail label="Theme" value={event.theme} />
              <Detail label="Dates" value={`${fmtDate(event.date_start)} to ${fmtDate(event.date_end)}`} />
              <Detail label="Venue" value={event.venue} />
              <Detail label="City" value={event.city} />
              <Detail label="Funder" value={event.funder} />
              <Detail label="Report link" value={event.report_doc_link} />
              <Detail label="Drive folder" value={event.drive_folder_link} />
            </div>
          </div>

          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-3">Role coverage</p>
            <div className="space-y-2">
              {roles.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">No speaker, judge or host roles recorded.</p>
              ) : roles.map((role: any) => (
                <div key={role.event_role_id ?? `${role.person_id}-${role.role_type}`} className="rounded-lg border border-border bg-white px-3 py-2">
                  <p className="text-[11px] font-medium">{role.person?.full_name ?? "-"}</p>
                  <p className="text-[10px] text-muted-foreground">{role.role_type ?? role.role_at_event ?? "Role not set"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-2">Internal note</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {event.notes ?? "No notes recorded for this event yet."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2">
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-[11px] font-medium text-foreground mt-1 break-words">{value || "-"}</p>
    </div>
  );
}
