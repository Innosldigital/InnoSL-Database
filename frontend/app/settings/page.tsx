import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { createServerSupabaseClient } from "@/lib/supabase";

export const metadata = { title: "Settings" };

const SECTIONS = [
  {
    title: "Import queue",
    desc: "Review staged records, validation outcomes, and pending approvals.",
    href: "/import/queue",
    status: "Operational",
  },
  {
    title: "Data import workspace",
    desc: "Upload new programme files and run mapping, validation, and deduplication.",
    href: "/import",
    status: "Operational",
  },
  {
    title: "People export",
    desc: "Download the current beneficiary and contact register as CSV.",
    href: "/api/people/export",
    status: "Operational",
  },
  {
    title: "Annual report export",
    desc: "Generate the annual CSV snapshot for donor and management reporting.",
    href: "/api/reports/annual",
    status: "Operational",
  },
  {
    title: "Printable summary",
    desc: "Open the printable HTML dashboard summary for quick sharing or PDF print.",
    href: "/api/reports/pdf",
    status: "Operational",
  },
  {
    title: "Audit trail",
    desc: "Monitor record inserts, updates, approvals, and operational activity.",
    href: "/import/queue",
    status: "Operational",
  },
];

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient();
  const [stagingRes, auditRes, peopleRes] = await Promise.all([
    supabase.from("staging_import").select("staging_id", { count: "exact", head: true }),
    supabase.from("audit_log").select("log_id", { count: "exact", head: true }),
    supabase.from("person").select("person_id", { count: "exact", head: true }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Settings" subtitle="System configuration - exports - monitoring" />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard label="People records" value={peopleRes.count ?? 0} />
        <MetricCard label="Audit log entries" value={auditRes.count ?? 0} />
        <MetricCard label="Staged imports" value={stagingRes.count ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="isl-card p-5 transition-colors hover:border-[#7B5EA7]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-foreground">{section.title}</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{section.desc}</p>
              </div>
              <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[10px] font-medium text-[#4338CA]">
                {section.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="isl-card p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
