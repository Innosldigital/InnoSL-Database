import { Suspense } from "react";
import { getPitches } from "@/lib/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { YearFilter } from "@/components/shared/YearFilter";
import { PitchesTable } from "@/components/pitches/PitchesTable";
import { FirstFemaleWidget } from "@/components/pitches/FirstFemaleWidget";

export const metadata = { title: "Pitch Competitions" };

// Programme → event_type enum mapping
const PROG_TO_TYPE: Record<string, string> = {
  FPN: "FPN", FIW: "FIW", GEW: "GEW", OSVP: "OSVP",
  Dare2Aspire: "Dare2Aspire", SLEDP: "SLEDP", EWC: "EWC", NYEFF: "NYEFF",
};

interface Props { searchParams: { year?: string; winner?: string; programme?: string } }

export default async function PitchesPage({ searchParams }: Props) {
  const eventType = searchParams.programme && searchParams.programme !== "All"
    ? PROG_TO_TYPE[searchParams.programme]
    : undefined;

  const pitches = await getPitches({
    year:       searchParams.year ? Number(searchParams.year) : undefined,
    event_type: eventType,
    winner:     searchParams.winner === "true",
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Pitch competitions"
        subtitle="FPN · OSVP · EWC · GEW pitch tracks · 2018-2026"
        actions={[
          { label: "Export CSV",        href: "/api/pitches/export",             variant: "secondary" },
          { label: "Download template", href: "/api/pitches/export?template=1",  variant: "secondary" },
          { label: "Import CSV →",      href: "/import",                         variant: "secondary" },
          { label: "+ Add pitch",       href: "/pitches/new",                    variant: "primary"   },
        ]}
      />
      <Suspense fallback={null}><FirstFemaleWidget /></Suspense>
      <Suspense fallback={<div className="h-10 animate-pulse rounded-xl bg-white/50" />}>
        <YearFilter showProgramme={true} />
      </Suspense>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/50" />}>
        <PitchesTable pitches={pitches} />
      </Suspense>
    </div>
  );
}
