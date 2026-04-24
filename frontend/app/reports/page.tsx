import { PageHeader } from "@/components/shared/PageHeader";

export const metadata = { title: "Impact Reports" };

const REPORT_TYPES = [
  { title: "Annual impact report", desc: "Full year-by-year breakdown of all beneficiaries, events and capital", href: "/api/reports/annual", colour: "#2D1B69" },
  { title: "Gender equity report", desc: "Women, girls, aged and youth beneficiary analysis across all programmes", href: "/api/reports/equity", colour: "#EC4899" },
  { title: "Donor programme report", desc: "KPI-based report filtered by funder and programme period", href: "/api/reports/donor", colour: "#22C55E" },
  { title: "First female winners report", desc: "Historic first female beneficiaries and winners by event type", href: "/api/reports/female-firsts", colour: "#8B5CF6" },
  { title: "Capital deployment report", desc: "All grants, prizes and seed capital with recipient demographics", href: "/api/reports/capital", colour: "#F59E0B" },
  { title: "M&E performance report", desc: "KPIs tracked against targets across all active programmes", href: "/api/reports/mel", colour: "#38BDF8" },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Impact reports" subtitle="Generate donor-ready reports on demand · all programmes · 2018-2026" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {REPORT_TYPES.map((r) => (
          <a
            key={r.title}
            href={r.href}
            className="isl-card p-5 hover:border-[#7B5EA7] hover:shadow-sm transition-all group cursor-pointer flex gap-4 items-start"
          >
            <div
              className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
              style={{ background: r.colour }}
            >
              PDF
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground group-hover:text-[#2D1B69] transition-colors">{r.title}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
              <p className="text-[10px] text-[#1E40AF] mt-2 group-hover:underline">Open report endpoint</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
