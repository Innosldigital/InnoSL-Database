import { Suspense } from "react";
import { getCohorts } from "@/lib/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { YearFilter } from "@/components/shared/YearFilter";

export const metadata = { title: "Incubation & Acceleration" };

interface Props {
  searchParams: { year?: string; programme?: string };
}

function formatDate(value?: string | null) {
  return value ? value.slice(0, 10) : "-";
}

export default async function CohortsPage({ searchParams }: Props) {
  const year      = searchParams.year ? Number(searchParams.year) : undefined;
  const programme = searchParams.programme;

  const cohorts        = await getCohorts({ year, programme });
  const totalStartups  = cohorts.reduce((sum, c) => sum + (c.total_startups  ?? 0), 0);
  const totalGraduated = cohorts.reduce((sum, c) => sum + (c.graduated_count ?? 0), 0);
  const totalJobs      = cohorts.reduce((sum, c) => sum + (c.jobs_created    ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Incubation & acceleration"
        subtitle="All cohort members and programme outcomes - 2018-2026"
        actions={[
          { label: "Export CSV",        href: "/api/cohorts/export",             variant: "secondary" },
          { label: "Download template", href: "/api/cohorts/export?template=1",  variant: "secondary" },
          { label: "Import CSV →",      href: "/import",                         variant: "secondary" },
          { label: "+ Add cohort",      href: "/cohorts/new",                    variant: "primary"   },
        ]}
      />

      <Suspense fallback={<div className="h-10 animate-pulse rounded-xl bg-white/50" />}>
        <YearFilter showProgramme={true} />
      </Suspense>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard label="Cohorts"           value={cohorts.length} />
        <MetricCard label="Startups tracked"  value={totalStartups} />
        <MetricCard label="Jobs created"      value={totalJobs} helper={`${totalGraduated} graduated`} />
      </div>

      <div className="isl-card overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              {["Programme", "Year", "Window", "Startups", "Graduated", "Jobs", "ESO trained"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[11px] text-muted-foreground">
                  No cohort records{year || programme ? " matching this filter" : " yet"}.
                </td>
              </tr>
            ) : cohorts.map((cohort) => (
              <tr key={cohort.cohort_id}>
                <td>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{cohort.programme_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {cohort.funder ?? "No funder"}{cohort.cohort_number ? ` - Cohort ${cohort.cohort_number}` : ""}
                    </span>
                  </div>
                </td>
                <td>{cohort.year ?? "-"}</td>
                <td className="text-muted-foreground">{formatDate(cohort.start_date)} to {formatDate(cohort.end_date)}</td>
                <td>{cohort.total_startups  ?? 0}</td>
                <td>{cohort.graduated_count ?? 0}</td>
                <td>{cohort.jobs_created    ?? 0}</td>
                <td>{cohort.eso_trained_flag ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: number; helper?: string }) {
  return (
    <div className="isl-card p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      {helper ? <p className="mt-1 text-[11px] text-muted-foreground">{helper}</p> : null}
    </div>
  );
}
