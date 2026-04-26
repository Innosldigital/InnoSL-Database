// ── DONOR ROI TABLE ─────────────────────────────────────────
import { fmtNum, fmtUSD } from "@/lib/utils";

interface RoiRow {
  funder: string; grant_type: string; disbursements: number;
  total_usd_in: number; jobs_created: number; revenue_generated: number;
  women_led_recipients: number; usd_to_women: number; pct_to_women: number;
  cost_per_job_usd: number; first_disbursement: string; last_disbursement: string;
}

interface Props { data: RoiRow[] }

export function DonorROITable({ data }: Props) {
  const totalIn      = data.reduce((a, r) => a + (r.total_usd_in ?? 0), 0);
  const totalJobs    = data.reduce((a, r) => a + (r.jobs_created ?? 0), 0);
  const totalToWomen = data.reduce((a, r) => a + (r.usd_to_women ?? 0), 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Total capital deployed",   value: fmtUSD(totalIn),      colour: "#2D1B69" },
          { label: "Jobs created (confirmed)",  value: fmtNum(totalJobs),    colour: "#22C55E" },
          { label: "Capital to women-led biz",  value: fmtUSD(totalToWomen), colour: "#EC4899" },
        ].map(k => (
          <div key={k.label} className="isl-card px-4 py-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: k.colour }} />
            <p className="text-[20px] font-semibold mt-1" style={{ color: k.colour }}>{k.value}</p>
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Per-funder table */}
      <div className="isl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-[12px] font-medium">Capital ROI by funder</p>
          <a href="/grants" className="text-[10px] text-[#1E40AF] hover:underline">
            Full grants detail →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Funder","Type","Disbursements","Total (USD)","Jobs created",
                  "To women-led","% to women","Cost/job","Period"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-[11px]">
                    No grant data yet. Import 12_grant_capital.csv to populate.
                  </td>
                </tr>
              ) : data.map((r, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/20">
                  <td className="px-3 py-2.5 font-medium text-foreground">{r.funder}</td>
                  <td className="px-3 py-2.5"><span className="pill bg-[#EDE8F8] text-[#4A2FA0]">{r.grant_type?.replace("_"," ")}</span></td>
                  <td className="px-3 py-2.5 text-center">{r.disbursements}</td>
                  <td className="px-3 py-2.5 font-medium text-green-700">{fmtUSD(r.total_usd_in)}</td>
                  <td className="px-3 py-2.5 text-center">{r.jobs_created || "—"}</td>
                  <td className="px-3 py-2.5 text-pink-700 font-medium">
                    {r.usd_to_women > 0 ? fmtUSD(r.usd_to_women) : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    {r.pct_to_women > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-muted/40 rounded-full min-w-[40px]">
                          <div className="h-1.5 rounded-full bg-pink-400"
                            style={{ width: `${Math.min(r.pct_to_women, 100)}%` }} />
                        </div>
                        <span className="text-[9px] text-muted-foreground">{r.pct_to_women}%</span>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {r.cost_per_job_usd ? `$${fmtNum(r.cost_per_job_usd)}` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-[9px] text-muted-foreground">
                    {r.first_disbursement?.slice(0,7)} → {r.last_disbursement?.slice(0,7)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── SDG DASHBOARD ────────────────────────────────────────────
interface SdgRow {
  sdg_code: string; sdg_title: string; sdg_color: string;
  primary_metric: string; metric_label: string; evidence_text: string;
}

interface SdgProps { data: SdgRow[] }

export function SDGDashboard({ data }: SdgProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="isl-card px-4 py-3 border-l-4 border-l-[#4A2FA0]">
        <p className="text-[12px] font-medium text-foreground">SDG alignment — auto-computed from live data</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Innovation SL contributes to 8 of 17 Sustainable Development Goals.
          These metrics update automatically as you import new data.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {data.map((sdg, i) => (
          <div key={i} className="isl-card overflow-hidden">
            <div className="flex">
              {/* SDG badge */}
              <div className="w-20 flex-shrink-0 flex flex-col items-center justify-center py-4"
                style={{ background: sdg.sdg_color }}>
                <p className="text-[22px] font-bold text-white leading-none">{sdg.sdg_code.split(" ")[1]}</p>
                <p className="text-[8px] text-white/80 text-center mt-1 px-1 leading-tight">{sdg.sdg_title}</p>
              </div>
              {/* Content */}
              <div className="flex-1 px-4 py-3">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <p className="text-[20px] font-semibold text-foreground">{sdg.primary_metric}</p>
                  <p className="text-[10px] text-muted-foreground">{sdg.metric_label}</p>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{sdg.evidence_text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="isl-card px-4 py-3 bg-[#EDE8F8]/50">
        <p className="text-[10px] text-[#4A2FA0] leading-relaxed">
          <span className="font-medium">Strongest for donors: </span>
          SDG 5 (Gender Equality) and SDG 8 (Decent Work) should lead every proposal.
          SDG 9 (Innovation) differentiates you from welfare-focused NGOs —
          you are building a market, not just delivering services.
        </p>
      </div>
    </div>
  );
}
