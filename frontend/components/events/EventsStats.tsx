import { getEvents } from "@/lib/queries";
import { fmtNum }    from "@/lib/utils";

export async function EventsStats() {
  const { count } = await getEvents({ per_page: 1 });
  const stats = [
    { label: "Total events",     value: fmtNum(count), colour: "#2D1B69" },
    { label: "FPN editions",     value: "47+",          colour: "#F59E0B" },
    { label: "FIW editions",     value: "4",            colour: "#8B5CF6" },
    { label: "GEW editions",     value: "7",            colour: "#3B82F6" },
    { label: "OSVP editions",    value: "6",            colour: "#EC4899" },
    { label: "Total attendance", value: "4,800+",       colour: "#22C55E" },
  ];
  return (
    <div className="isl-card">
      <div className="grid grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="text-center py-3 border-r border-border last:border-r-0 relative">
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: s.colour }} />
            <p className="text-[16px] font-semibold mt-1" style={{ color: s.colour }}>{s.value}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
