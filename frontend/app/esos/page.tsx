import { getEsoPartners } from "@/lib/queries";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata = { title: "ESO Partners" };

function formatDate(value?: string | null) {
  return value ? value.slice(0, 10) : "-";
}

export default async function ESOsPage() {
  const partners = await getEsoPartners();
  const activeCount = partners.filter((partner) => partner.active_partner).length;
  const trainedCount = partners.filter((partner) => partner.trained_by_isl).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="ESO & partner organisations"
        subtitle="All ecosystem partners, funders and trained ESOs"
        actions={[{ label: "+ Add partner", href: "/esos/new", variant: "primary" }]}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard label="Partners" value={partners.length} />
        <MetricCard label="Active partners" value={activeCount} />
        <MetricCard label="Trained by ISL" value={trainedCount} />
      </div>

      <div className="isl-card overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              {["Organisation", "Type", "Location", "Training", "Funder", "Contact", "Status"].map((heading) => (
                <th key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {partners.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[11px] text-muted-foreground">
                  No partner organisations recorded yet.
                </td>
              </tr>
            ) : partners.map((partner) => (
              <tr key={partner.eso_id}>
                <td>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{partner.name}</span>
                    <span className="text-[10px] text-muted-foreground">{partner.website ?? "No website recorded"}</span>
                  </div>
                </td>
                <td>{partner.eso_type ?? "-"}</td>
                <td>{[partner.city, partner.country].filter(Boolean).join(", ") || "-"}</td>
                <td>{partner.trained_by_isl ? formatDate(partner.training_date) : "Not yet"}</td>
                <td>{partner.funder ?? "-"}</td>
                <td>{partner.contact_person ?? "-"}</td>
                <td>{partner.active_partner ? "Active" : "Inactive"}</td>
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
