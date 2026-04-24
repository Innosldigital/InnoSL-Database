import { Suspense } from "react";
import { getDashboardKPIs } from "@/lib/queries";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { BeneficiaryChart } from "@/components/dashboard/BeneficiaryChart";
import { MonthlyActivityChart } from "@/components/dashboard/MonthlyActivityChart";
import { CapitalChart } from "@/components/dashboard/CapitalChart";
import { GenderSplitChart } from "@/components/dashboard/GenderSplitChart";
import { SectorBreakdownChart } from "@/components/dashboard/SectorBreakdownChart";
import { EquityPanel } from "@/components/dashboard/EquityPanel";
import { ProgrammeCalendar } from "@/components/dashboard/ProgrammeCalendar";
import { GrowthTrendChart } from "@/components/dashboard/GrowthTrendChart";
import { YearFilter } from "@/components/shared/YearFilter";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata = { title: "Analytics Dashboard" };

interface DashboardPageProps {
  searchParams?: { year?: string };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const kpis = await getDashboardKPIs();
  const selectedYear = searchParams?.year ? Number(searchParams.year) : undefined;
  const year = Number.isFinite(selectedYear) ? selectedYear! : new Date().getFullYear();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Analytics dashboard"
        subtitle="Innovation SL · 2018-2026 · all programmes · real-time"
        actions={[
          { label: "Export PDF ↗", href: "/api/reports/pdf", variant: "secondary" },
          { label: "Donor report ↗", href: "/reports", variant: "primary" },
        ]}
      />

      <Suspense fallback={<div className="h-10 animate-pulse rounded-xl bg-white/50" />}>
        <YearFilter showProgramme={true} />
      </Suspense>

      <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-white/50" />}>
        <KPIGrid equity={kpis.equity} eventsCount={kpis.events_count} totalUSD={kpis.total_usd} />
      </Suspense>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <BeneficiaryChart data={kpis.byYear} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <MonthlyActivityChart data={kpis.monthly} year={year} />
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
        <GrowthTrendChart data={kpis.byYear} />
      </Suspense>
    </div>
  );
}

function ChartSkeleton({ h = "h-56" }: { h?: string }) {
  return <div className={`${h} animate-pulse rounded-xl bg-white/60`} />;
}
