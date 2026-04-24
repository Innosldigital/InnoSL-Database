import Link from "next/link";

const PROGRAMMES = [
  { code:"FPN",  label:"Freetown Pitch Night",        schedule:"Monthly · Jan–Dec",  freq:"12/yr", bg:"#FEF3C7", text:"#92400E", href:"/pitches?programme=FPN" },
  { code:"FIW",  label:"Freetown Innovation Week",    schedule:"Annual · May–Jul",   freq:"1/yr",  bg:"#EDE9FE", text:"#5B21B6", href:"/events?programme=FIW" },
  { code:"GEW",  label:"Global Entrepreneurship Wk", schedule:"Annual · November",  freq:"1/yr",  bg:"#DBEAFE", text:"#1E40AF", href:"/events?programme=GEW" },
  { code:"OSVP", label:"Orange Social Venture Prize", schedule:"Annual · Sep–Oct",   freq:"1/yr",  bg:"#FCE7F3", text:"#9D174D", href:"/pitches?programme=OSVP" },
  { code:"INC",  label:"Incubation cohorts",          schedule:"Rolling · quarterly",freq:"4/yr",  bg:"#D1FAE5", text:"#065F46", href:"/cohorts" },
  { code:"TRN",  label:"Workshops & training",        schedule:"Monthly · ongoing",  freq:"8/yr",  bg:"#FEE2E2", text:"#991B1B", href:"/training" },
  { code:"D2A",  label:"Dare2Aspire",                 schedule:"Annual · November",  freq:"1/yr",  bg:"#FEF9C3", text:"#854D0E", href:"/events?programme=Dare2Aspire" },
  { code:"BDS",  label:"Business diagnostics",        schedule:"Rolling · monthly",  freq:"20/yr", bg:"#F0FDF4", text:"#166534", href:"/diagnostics" },
];

export function ProgrammeCalendar() {
  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Monthly programme calendar</p>
        <a href="/events" className="text-[10px] text-[#1E40AF] hover:underline">View schedule →</a>
      </div>
      <div className="grid grid-cols-2">
        {PROGRAMMES.map((p, i) => (
          <Link
            key={p.code}
            href={p.href}
            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#F5F2FD] transition-colors border-b border-r border-border last:border-b-0"
            style={{ borderRight: i % 2 === 0 ? undefined : "none" }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
              style={{ background: p.bg, color: p.text }}
            >
              {p.code}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-foreground leading-tight truncate">{p.label}</p>
              <p className="text-[10px] text-muted-foreground">{p.schedule}</p>
            </div>
            <span className="text-[10px] font-medium text-[#2D1B69] flex-shrink-0">{p.freq}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
