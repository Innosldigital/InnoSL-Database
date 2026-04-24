import { notFound } from "next/navigation";
import { getPitchById } from "@/lib/queries";
import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { PitchOutcomeCard } from "@/components/pitches/PitchOutcomeCard";

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const pitch = await getPitchById(params.id);
    return { title: pitch?.organisation?.name ?? pitch?.person?.full_name ?? "Pitch Record" };
  } catch {
    return { title: "Pitch Record" };
  }
}

export default async function PitchDetailPage({ params }: { params: { id: string } }) {
  let pitch;
  try {
    pitch = await getPitchById(params.id);
  } catch {
    notFound();
  }

  if (!pitch) notFound();

  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/pitches" label="Pitch competitions" ref={pitch.isl_ref} />

      <PageHeader
        title={pitch.organisation?.name ?? pitch.person?.full_name ?? "Pitch record"}
        subtitle={`${pitch.event?.event_type ?? "Event"} · ${pitch.event?.edition_year ?? "Year not set"} · ${pitch.category ?? "Category not set"}`}
        actions={[
          pitch.person_id
            ? { label: "Open person", href: `/people/${pitch.person_id}`, variant: "secondary" }
            : { label: "Open person", variant: "secondary" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-4">
          <PitchOutcomeCard pitch={pitch} />

          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-3">Pitch details</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Detail label="Founder" value={pitch.person?.full_name} />
              <Detail label="Organisation" value={pitch.organisation?.name} />
              <Detail label="Sector" value={pitch.organisation?.sector} />
              <Detail label="Application code" value={pitch.application_code} />
              <Detail label="Theme" value={pitch.theme} />
              <Detail label="Prize currency" value={pitch.prize_currency} />
            </div>
          </div>

          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-3">Idea description</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {pitch.idea_description ?? "No pitch description was recorded for this submission."}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-3">Historical flags</p>
            <div className="flex flex-wrap gap-2">
              {pitch.winner_flag && <span className="pill bg-green-100 text-green-800">Winner</span>}
              {pitch.finalist_flag && <span className="pill bg-blue-100 text-blue-800">Finalist</span>}
              {pitch.first_female_flag && <span className="pill bg-pink-100 text-pink-800">First female</span>}
              {pitch.first_time_flag && <span className="pill bg-amber-100 text-amber-800">First-time pitcher</span>}
              {pitch.repeat_pitcher_flag && <span className="pill bg-[#EDE8F8] text-[#4A2FA0]">Repeat pitcher</span>}
              {!pitch.winner_flag && !pitch.finalist_flag && !pitch.first_female_flag && !pitch.first_time_flag && !pitch.repeat_pitcher_flag && (
                <span className="text-[11px] text-muted-foreground">No historical flags recorded.</span>
              )}
            </div>
          </div>

          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-3">Linked event</p>
            <div className="space-y-2">
              <Detail label="Event name" value={pitch.event?.name} />
              <Detail label="Event type" value={pitch.event?.event_type} />
              <Detail label="Programme" value={pitch.event?.programme} />
              <Detail label="Venue" value={pitch.event?.venue} />
            </div>
          </div>

          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-3">Notes</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {pitch.notes ?? "No notes recorded for this pitch yet."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-[11px] font-medium text-foreground break-words">{value || "-"}</p>
    </div>
  );
}
