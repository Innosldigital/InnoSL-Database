import { getVipContacts } from "@/lib/queries";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata = { title: "VIP Contacts" };

function formatDate(value?: string | null) {
  return value ? value.slice(0, 10) : "-";
}

export default async function VIPsPage() {
  const contacts = await getVipContacts();
  const recentlyEngaged = contacts.filter((contact) => Boolean(contact.last_engaged)).length;
  const investorCount = contacts.filter((contact) => contact.contact_type === "Investor").length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="VIP contacts"
        subtitle="Investors - diplomats - government - media - development partners"
        actions={[{ label: "+ Add VIP contact", href: "/vips/new", variant: "primary" }]}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard label="VIP contacts" value={contacts.length} />
        <MetricCard label="Investors" value={investorCount} />
        <MetricCard label="Recently engaged" value={recentlyEngaged} />
      </div>

      <div className="isl-card overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              {["Person", "Type", "Organisation", "Country", "Last engaged", "Owner", "Events"].map((heading) => (
                <th key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[11px] text-muted-foreground">
                  No VIP contacts recorded yet.
                </td>
              </tr>
            ) : contacts.map((contact) => (
              <tr key={contact.contact_id}>
                <td>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{contact.person?.full_name ?? "Unknown contact"}</span>
                    <span className="text-[10px] text-muted-foreground">{contact.title ?? "No title recorded"}</span>
                  </div>
                </td>
                <td>{contact.contact_type}</td>
                <td>{contact.organisation ?? "-"}</td>
                <td>{contact.country ?? "-"}</td>
                <td>{formatDate(contact.last_engaged)}</td>
                <td>{contact.relationship_owner ?? "-"}</td>
                <td>{contact.events_attended ?? 0}</td>
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
