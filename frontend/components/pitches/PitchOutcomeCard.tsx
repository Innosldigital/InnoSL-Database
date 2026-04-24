import { fmtDate, fmtUSD } from "@/lib/utils";

interface Props {
  pitch: any;
}

export function PitchOutcomeCard({ pitch }: Props) {
  const status = pitch.winner_flag ? "Winner" : pitch.finalist_flag ? "Finalist" : "Participant";

  return (
    <div className="isl-card p-5">
      <p className="text-[12px] font-medium mb-3">Outcome summary</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Detail label="Status" value={status} />
        <Detail label="Category" value={pitch.category} />
        <Detail label="Score" value={pitch.score != null ? String(pitch.score) : "-"} />
        <Detail label="Rank" value={pitch.rank != null ? `#${pitch.rank}` : "-"} />
        <Detail label="Prize amount" value={pitch.prize_amount ? fmtUSD(Number(pitch.prize_amount)) : "-"} />
        <Detail label="Prize type" value={pitch.prize_type} />
        <Detail label="Pitch stage" value={pitch.pitch_stage} />
        <Detail label="Created" value={fmtDate(pitch.created_at)} />
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
