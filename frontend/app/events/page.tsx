import { Suspense } from "react";
import { getEvents } from "@/lib/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { YearFilter } from "@/components/shared/YearFilter";
import { EventsTable } from "@/components/events/EventsTable";
import { EventsStats } from "@/components/events/EventsStats";

export const metadata = { title: "Events & Attendance" };

interface Props {
  searchParams: { search?: string; event_type?: string; year?: string; page?: string };
}

export default async function EventsPage({ searchParams }: Props) {
  const filters = {
    search: searchParams.search,
    event_type: searchParams.event_type as any,
    year: searchParams.year ? Number(searchParams.year) : undefined,
    page: searchParams.page ? Number(searchParams.page) : 1,
    per_page: 20,
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
        <YearFilter showProgramme={false} />
      </Suspense>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/50" />}>
        <EventsTable events={events} total={count} page={filters.page} perPage={filters.per_page} />
      </Suspense>
    </div>
  );
}
