import { Suspense }           from "react";
import {
  getDonorBriefingData, getDonorRoi, getEcosystemStrength,
  getSdgContributions, getYearlyKpiTrend, getCohortTotals,
  getJourneyStats,
} from "@/queries/analytics-queries";
import { fmtNum, fmtUSD, fmtPct } from "@/lib/utils";
import { DonorROITable, SDGDashboard } from "@/components/reports/DonorComponents";

export const metadata = { title: "Donor Briefing" };

interface Props {
  searchParams: { funder?: string; programme?: string }
}

export default async function DonorBriefingPage({ searchParams }: Props) {
  const funder = searchParams.funder ?? "All partners";

  const [briefing, roi, ecosys, sdgs, trend, cohortTotals, journey] = await Promise.all([
    getDonorBriefingData(),
    getDonorRoi(),
    getEcosystemStrength(),
    getSdgContributions(),
    getYearlyKpiTrend(),
    getCohortTotals(),
    getJourneyStats(),
  ]);

  const yearsActive = briefing
    ? (briefing.latest_year - briefing.first_year + 1)
    : 0;

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#2D1B69] rounded-xl flex items-center justify-center text-white font-bold text-sm">
              ISL
            </div>
            <div>
              <h1 className="text-[18px] font-semibold">Innovation Sierra Leone</h1>
              <p className="text-[11px] text-muted-foreground">
                Impact briefing · Generated {new Date().toLocaleDateString("en-SL", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Freetown, Sierra Leone · Est. {briefing?.founded_year ?? 2017} ·
            Ecosystem Intelligence Platform · Real-time data
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/reports/donor?print=1"
            className="px-3 py-1.5 text-[11px] border border-border rounded-lg bg-white hover:bg-muted/50">
            Export PDF ↓
          </a>
          <a href="/reports"
            className="px-3 py-1.5 text-[11px] bg-[#2D1B69] text-white rounded-lg hover:bg-[#4A2FA0]">
            All reports →
          </a>
        </div>
      </div>

      {/* ── HEADLINE NUMBERS ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Total beneficiaries",
            value: fmtNum(briefing?.total_beneficiaries),
            sub: `${yearsActive} years · ${briefing?.first_year}–${briefing?.latest_year}`,
            colour: "#2D1B69",
          },
          {
            label: "Female beneficiaries",
            value: fmtPct(briefing?.pct_female),
            sub: `${fmtNum(briefing?.female_beneficiaries)} women & girls`,
            colour: "#EC4899",
          },
          {
            label: "Capital deployed",
            value: fmtUSD(briefing?.capital_deployed_usd),
            sub: `${fmtUSD(briefing?.capital_to_women_usd)} to women-led`,
            colour: "#22C55E",
          },
          {
            label: "Jobs created",
            value: fmtNum(cohortTotals.jobs_created),
            sub: `across ${cohortTotals.total_cohorts} cohort programmes`,
            colour: "#38BDF8",
          },
        ].map(k => (
          <div key={k.label} className="isl-card px-4 py-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: k.colour }} />
            <p className="text-[22px] font-bold mt-1" style={{ color: k.colour }}>{k.value}</p>
            <p className="text-[11px] font-medium text-foreground">{k.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── SECOND ROW KPIs ── */}
      <div className="grid grid-cols-5 gap-2.5">
        {[
          { label: "Events run",         value: fmtNum(briefing?.total_events),        colour: "#4A2FA0" },
          { label: "Startups supported", value: fmtNum(briefing?.startups_supported),  colour: "#7B5EA7" },
          { label: "People trained",     value: fmtNum(briefing?.people_trained),      colour: "#38BDF8" },
          { label: "Women trained",      value: fmtNum(briefing?.women_trained),       colour: "#EC4899" },
          { label: "ESO partners",       value: fmtNum(briefing?.active_eso_partners), colour: "#C9821A" },
        ].map(k => (
          <div key={k.label} className="isl-card px-3 py-2.5 text-center">
            <p className="text-[17px] font-semibold" style={{ color: k.colour }}>{k.value}</p>
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── FLAGSHIP GENDER STORY ── */}
      <div className="isl-card px-5 py-4 border-l-4 border-l-pink-400">
        <p className="text-[11px] font-semibold text-pink-800 mb-1">Gender equity flagship story</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {briefing?.gender_flagship_story}
        </p>
      </div>

      {/* ── 9-YEAR GROWTH ── */}
      <div className="isl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-[12px] font-medium">9-year programme growth — {briefing?.first_year}–{briefing?.latest_year}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Year","Events","Beneficiaries","Female","% Female","Pitches","Female pitchers","Training"].map(h => (
                  <th key={h} className="px-3 py-2 text-center text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trend.map((r: any) => (
                <tr key={r.year} className="border-b border-border hover:bg-muted/20">
                  <td className="px-3 py-2 text-center font-semibold text-[#2D1B69]">{r.year}</td>
                  <td className="px-3 py-2 text-center">{r.events || "—"}</td>
                  <td className="px-3 py-2 text-center font-medium">{r.total_beneficiaries || "—"}</td>
                  <td className="px-3 py-2 text-center text-pink-700">{r.female_beneficiaries || "—"}</td>
                  <td className="px-3 py-2 text-center">
                    {r.pct_female ? (
                      <span className={r.pct_female >= 50 ? "text-green-700 font-medium" : "text-amber-700"}>
                        {r.pct_female}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 text-center">{r.pitches || "—"}</td>
                  <td className="px-3 py-2 text-center text-pink-600">{r.female_pitches || "—"}</td>
                  <td className="px-3 py-2 text-center">{r.training_participants || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── JOURNEY STATS ── */}
      <div className="isl-card px-5 py-4">
        <p className="text-[12px] font-medium mb-3">Ecosystem depth — beneficiary journey analysis</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Completed full journey (5 steps)", value: journey.score5, colour: "#2D1B69",
              sub: "Pitch + train + incubate + grant + diagnostic" },
            { label: "Multi-programme beneficiaries",    value: journey.score3 + journey.score4 + journey.score5,
              colour: "#4A2FA0", sub: "3+ programmes engaged" },
            { label: "Women with multi-programme",       value: journey.female_multi, colour: "#EC4899",
              sub: "Gender equity through all stages" },
            { label: "Received capital + pitched",       value: journey.has_grant, colour: "#22C55E",
              sub: "Pitch-to-investment conversion" },
          ].map(k => (
            <div key={k.label} className="bg-muted/30 rounded-xl p-3">
              <p className="text-[20px] font-semibold" style={{ color: k.colour }}>{k.value}</p>
              <p className="text-[10px] font-medium text-foreground mt-0.5">{k.label}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CAPITAL ROI ── */}
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-white/60" />}>
        <DonorROITable data={roi} />
      </Suspense>

      {/* ── SDG ALIGNMENT ── */}
      <Suspense fallback={<div className="h-60 animate-pulse rounded-xl bg-white/60" />}>
        <SDGDashboard data={sdgs} />
      </Suspense>

      {/* ── ECOSYSTEM PARTNERS ── */}
      <div className="isl-card px-5 py-4">
        <p className="text-[12px] font-medium mb-3">Ecosystem & partnerships</p>
        <div className="grid grid-cols-4 gap-3 mb-3">
          {[
            { label: "Total ESO partners",    value: fmtNum(ecosys?.total_eso_partners), colour: "#2D1B69" },
            { label: "Active partnerships",   value: fmtNum(ecosys?.active_partnerships), colour: "#22C55E" },
            { label: "Countries reached",     value: fmtNum(ecosys?.countries_reached),  colour: "#38BDF8" },
            { label: "ISL-trained ESOs",      value: fmtNum(ecosys?.esos_isl_trained),   colour: "#C9821A" },
          ].map(k => (
            <div key={k.label} className="bg-muted/30 rounded-xl p-3 text-center">
              <p className="text-[20px] font-semibold" style={{ color: k.colour }}>{k.value}</p>
              <p className="text-[10px] text-muted-foreground">{k.label}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Partners include: {ecosys?.countries ?? "Sierra Leone, International"} ·
          Types: {ecosys?.partner_type_list ?? "Incubators, Development Partners, Investors, Universities"}
        </p>
      </div>

      {/* ── CONTACT ── */}
      <div className="isl-card px-5 py-4 bg-[#2D1B69] text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-semibold">Innovation Sierra Leone</p>
            <p className="text-[11px] text-white/70 mt-0.5">
              Freetown, Sierra Leone · innovationsl.org
            </p>
            <p className="text-[10px] text-white/50 mt-2">
              This briefing is generated in real-time from the ISL Ecosystem Intelligence Platform.
              Data is live as of {new Date().toLocaleDateString()}.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-white/70">Primary SDGs</p>
            <div className="flex gap-1.5 mt-1 justify-end">
              {["SDG 5","SDG 8","SDG 9"].map(s => (
                <span key={s} className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-medium text-white">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
