import { Suspense } from "react";
import { getDiagnostics } from "@/lib/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { YearFilter } from "@/components/shared/YearFilter";
import { DiagnosticsTable } from "@/components/diagnostics/DiagnosticsTable";

export const metadata = { title: "Business Diagnostics" };

interface Props {
  searchParams: { year?: string };
}

export default async function DiagnosticsPage({ searchParams }: Props) {
  const year        = searchParams.year ? Number(searchParams.year) : undefined;
  const diagnostics = await getDiagnostics({ year });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Business diagnostics"
        subtitle="SME assessments · ILO scorecards · ISL lendability index · 2018-2026"
        actions={[
          { label: "Export CSV",        href: "/api/diagnostics/export",             variant: "secondary" },
          { label: "Download template", href: "/api/diagnostics/export?template=1",  variant: "secondary" },
          { label: "Import CSV →",      href: "/import",                              variant: "secondary" },
          { label: "+ New diagnostic",  href: "/diagnostics/new",                    variant: "primary"   },
        ]}
      />
      <Suspense fallback={<div className="h-10 animate-pulse rounded-xl bg-white/50" />}>
        <YearFilter showProgramme={false} />
      </Suspense>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/50" />}>
        <DiagnosticsTable diagnostics={diagnostics} />
      </Suspense>
    </div>
  );
}
