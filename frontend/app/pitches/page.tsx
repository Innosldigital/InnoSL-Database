import { Suspense } from "react";
import { getPitches } from "@/lib/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { YearFilter } from "@/components/shared/YearFilter";
import { PitchesTable } from "@/components/pitches/PitchesTable";
import { FirstFemaleWidget } from "@/components/pitches/FirstFemaleWidget";

export const metadata = { title: "Pitch Competitions" };

interface Props { searchParams: { year?: string; winner?: string; programme?: string } }

export default async function PitchesPage({ searchParams }: Props) {
  const pitches = await getPitches({
    year: searchParams.year ? Number(searchParams.year) : undefined,
    event_type: searchParams.programme,
    winner: searchParams.winner === "true",
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Pitch competitions"
        subtitle="FPN · OSVP · EWC · GEW pitch tracks · 2018-2026"
        actions={[
          { label: "Export CSV", href: "/api/pitches/export", variant: "secondary" },
          { label: "+ Add pitch", href: "/pitches/new", variant: "primary" },
        ]}
      />
      <Suspense fallback={null}><FirstFemaleWidget /></Suspense>
      <Suspense fallback={<div className="h-10 animate-pulse rounded-xl bg-white/50" />}>
        <YearFilter />
      </Suspense>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/50" />}>
        <PitchesTable pitches={pitches} />
      </Suspense>
    </div>
  );
}
