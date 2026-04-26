import { Suspense } from "react";
import { getEvents } from "@/lib/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { YearFilter } from "@/components/shared/YearFilter";
import { EventsTable } from "@/components/events/EventsTable";
import { EventsStats } from "@/components/events/EventsStats";

export const metadata = { title: "Events & Attendance" };

// Programme → event_type enum mapping
const PROG_TO_TYPE: Record<string, string> = {
  FPN: "FPN", FIW: "FIW", GEW: "GEW", OSVP: "OSVP",
  Dare2Aspire: "Dare2Aspire", SLEDP: "SLEDP", EWC: "EWC", NYEFF: "NYEFF",
};

interface Props {
  searchParams: { search?: string; event_type?: string; year?: string; programme?: string; page?: string };
}

export default async function EventsPage({ searchParams }: Props) {
  // Resolve event_type: explicit event_type param wins, then programme mapping
  const resolvedType = searchParams.event_type
    ?? (searchParams.programme && searchParams.programme !== "All"
        ? PROG_TO_TYPE[searchParams.programme]
        : undefined);

  const filters = {
    search:     searchParams.search,
    event_type: resolvedType as any,
    year:       searchParams.year ? Number(searchParams.year) : undefined,
    page:       searchParams.page ? Number(searchParams.page) : 1,
    per_page:   20,
  };
  const { data: events, count } = await getEvents(filters);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Events & attendance"
        subtitle="Every event, registration and attendance record - 2018-2026"
        actions={[
          { label: "Export CSV",        href: "/api/events/export",              variant: "secondary" },
          { label: "Download template", href: "/api/events/export?template=1",   variant: "secondary" },
          { label: "Import CSV →",      href: "/import",                         variant: "secondary" },
          { label: "+ Add event",       href: "/events/new",                     variant: "primary"   },
        ]}
      />
      <Suspense fallback={null}><EventsStats /></Suspense>
      <Suspense fallback={<div className="h-10 animate-pulse rounded-xl bg-white/50" />}>
        <YearFilter showProgramme={true} />
      </Suspense>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/50" />}>
        <EventsTable events={events} total={count} page={filters.page} perPage={filters.per_page} />
      </Suspense>
    </div>
  );
}
