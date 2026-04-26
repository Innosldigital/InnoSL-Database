import { Suspense } from "react";
import { getPeople } from "@/lib/queries";
import { PeopleTable } from "@/components/people/PeopleTable";
import { PeopleFiltersBar } from "@/components/people/PeopleFiltersBar";
import { PeopleStats } from "@/components/people/PeopleStats";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata = { title: "People" };

interface Props {
  searchParams: {
    search?: string; gender?: string; age_group?: string;
    district?: string; year?: string; programme?: string;
    is_woman?: string; is_youth?: string; is_repeat?: string; page?: string;
  };
}

export default async function PeoplePage({ searchParams }: Props) {
  const filters = {
    search: searchParams.search,
    gender: searchParams.gender as any,
    age_group: searchParams.age_group as any,
    district: searchParams.district,
    year: searchParams.year ? Number(searchParams.year) : undefined,
    programme: searchParams.programme as any,
    is_woman: searchParams.is_woman === "true",
    is_youth: searchParams.is_youth === "true",
    is_repeat: searchParams.is_repeat === "true",
    page: searchParams.page ? Number(searchParams.page) : 1,
    per_page: 25,
  };

  const { data: people, count } = await getPeople(filters);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="People"
        subtitle="All beneficiaries, judges, speakers, hosts, exhibitors and contacts"
        actions={[
          { label: "Export CSV",        href: "/api/people/export",              variant: "secondary" },
          { label: "Download template", href: "/api/people/export?template=1",   variant: "secondary" },
          { label: "Import CSV →",      href: "/import",                         variant: "secondary" },
          { label: "Add person",        href: "/people/new",                     variant: "primary"   },
        ]}
      />

      <Suspense fallback={null}>
        <PeopleStats />
      </Suspense>

      <Suspense fallback={<div className="h-10 animate-pulse rounded-xl bg-white/50" />}>
        <PeopleFiltersBar current={filters} />
      </Suspense>

      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/50" />}>
        <PeopleTable
          people={people}
          total={count}
          page={filters.page}
          perPage={filters.per_page}
        />
      </Suspense>
    </div>
  );
}
