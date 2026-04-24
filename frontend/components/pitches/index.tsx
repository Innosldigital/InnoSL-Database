import { getFirstFemaleWinners } from "@/lib/queries";

export async function FirstFemaleWidget() {
  const winners = await getFirstFemaleWinners();
  if (!winners?.length) return null;

  return (
    <div className="isl-card border-l-4 border-l-pink-400">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="text-pink-600 text-base">♀</span>
        <p className="text-[12px] font-medium">Historic firsts — first female winners by programme</p>
      </div>
      <div className="grid grid-cols-3 gap-0">
        {winners.slice(0, 6).map((w: any, i: number) => (
          <div key={i} className="px-4 py-3 border-r border-b border-border last:border-r-0">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-1">{w.event_type} first female winner</p>
            <p className="text-[12px] font-semibold text-foreground">{w.full_name}</p>
            <p className="text-[10px] text-muted-foreground">{w.business_name ?? "—"}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="pill bg-pink-100 text-pink-800">{w.edition_year}</span>
              {w.prize_amount && (
                <span className="pill bg-green-100 text-green-800">${Number(w.prize_amount).toLocaleString()}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
