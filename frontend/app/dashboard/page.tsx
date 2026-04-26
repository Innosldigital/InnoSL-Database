import { Suspense } from "react";
import dynamic from "next/dynamic";
import { getDashboardKPIs } from "@/lib/queries";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { EquityPanel } from "@/components/dashboard/EquityPanel";
import { ProgrammeCalendar } from "@/components/dashboard/ProgrammeCalendar";
import { YearFilter } from "@/components/shared/YearFilter";
import { PageHeader } from "@/components/shared/PageHeader";

function ChartSkeleton({ h = "h-56" }: { h?: string }) {
  return <div className={`${h} animate-pulse rounded-xl bg-white/60`} />;
}

const BeneficiaryChart     = dynamic(() => import("@/components/dashboard/BeneficiaryChart").then(m => ({ default: m.BeneficiaryChart })), { ssr: false, loading: () => <ChartSkeleton /> });
const MonthlyActivityChart = dynamic(() => import("@/components/dashboard/MonthlyActivityChart").then(m => ({ default: m.MonthlyActivityChart })), { ssr: false, loading: () => <ChartSkeleton /> });
const CapitalChart         = dynamic(() => import("@/components/dashboard/CapitalChart").then(m => ({ default: m.CapitalChart })), { ssr: false, loading: () => <ChartSkeleton /> });
const GenderSplitChart     = dynamic(() => import("@/components/dashboard/GenderSplitChart").then(m => ({ default: m.GenderSplitChart })), { ssr: false, loading: () => <ChartSkeleton /> });
const SectorBreakdownChart = dynamic(() => import("@/components/dashboard/SectorBreakdownChart").then(m => ({ default: m.SectorBreakdownChart })), { ssr: false, loading: () => <ChartSkeleton /> });
const GrowthTrendChart     = dynamic(() => import("@/components/dashboard/GrowthTrendChart").then(m => ({ default: m.GrowthTrendChart })), { ssr: false, loading: () => <ChartSkeleton h="h-36" /> });

export const metadata = { title: "Analytics Dashboard" };

interface DashboardPageProps {
  searchParams?: { year?: string; programme?: string };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const year      = searchParams?.year      ? Number(searchParams.year) : undefined;
  const programme = searchParams?.programme ?? undefined;

  const kpis = await getDashboardKPIs({ year, programme });

  const activeYear        = year ?? new Date().getFullYear();
  const isFiltered        = !!year || (!!programme && programme !== "All");
  const filterLabel       = [year, programme && programme !== "All" ? programme : null].filter(Boolean).join(" · ");
  const subtitleText      = isFiltered
    ? `Filtered: ${filterLabel} · Innovation SL Ecosystem Intelligence`
    : "Innovation SL · 2018-2026 · all programmes · real-time";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Analytics dashboard"
        subtitle={subtitleText}
        actions={[
          { label: "Export PDF ↗", href: "/api/reports/pdf", variant: "secondary" },
          { label: "Donor report ↗", href: "/reports", variant: "primary" },
        ]}
      />

      <Suspense fallback={<div className="h-10 animate-pulse rounded-xl bg-white/50" />}>
        <YearFilter showProgramme={true} />
      </Suspense>

      <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-white/50" />}>
        <KPIGrid
          equity={kpis.equity}
          eventsCount={kpis.events_count}
          totalUSD={kpis.total_usd}
          jobsCreated={kpis.jobs_created}
          activeYear={year}
          activeProgramme={programme && programme !== "All" ? programme : undefined}
        />
      </Suspense>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <BeneficiaryChart data={kpis.byYear} activeYear={year} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <MonthlyActivityChart data={kpis.monthly} year={activeYear} programme={programme && programme !== "All" ? programme : undefined} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Suspense fallback={<ChartSkeleton />}>
          <CapitalChart data={kpis.capital} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <GenderSplitChart equity={kpis.equity} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <SectorBreakdownChart sectors={kpis.sectors} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <EquityPanel
            equity={kpis.equity}
            womenLedPct={kpis.women_led_pct}
            capitalToWomenPct={kpis.capital_to_women_pct}
          />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ProgrammeCalendar />
        </Suspense>
      </div>

      <Suspense fallback={<ChartSkeleton h="h-36" />}>
        <GrowthTrendChart data={kpis.byYear} activeYear={year} />
      </Suspense>
    </div>
  );
}
