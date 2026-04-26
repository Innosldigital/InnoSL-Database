import { Suspense } from "react";
import { getGrants, getCapitalSummary } from "@/lib/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { YearFilter } from "@/components/shared/YearFilter";
import { GrantsTable, GrantsSummary } from "@/components/grants/GrantsTable";

export const metadata = { title: "Grants & Capital" };

interface Props { searchParams: { funder?: string; year?: string; woman_led?: string } }

export default async function GrantsPage({ searchParams }: Props) {
  const [grants, summary] = await Promise.all([
    getGrants({ funder: searchParams.funder, year: searchParams.year ? Number(searchParams.year) : undefined }),
    getCapitalSummary(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Grants & capital"
        subtitle="All disbursements · prizes · seed capital · 2018-2026"
        actions={[
          { label: "Export CSV",        href: "/api/grants/export",              variant: "secondary" },
          { label: "Download template", href: "/api/grants/export?template=1",   variant: "secondary" },
          { label: "Import CSV →",      href: "/import",                         variant: "secondary" },
          { label: "+ Add grant",       href: "/grants/new",                     variant: "primary"   },
        ]}
      />
      <GrantsSummary summary={summary} />
      <Suspense fallback={<div className="h-10 animate-pulse rounded-xl bg-white/50" />}>
        <YearFilter showProgramme={false} />
      </Suspense>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/50" />}>
        <GrantsTable grants={grants} womanLed={searchParams.woman_led === "true"} />
      </Suspense>
    </div>
  );
}
