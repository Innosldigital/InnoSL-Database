import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RecordCreateForm, type CreateFieldConfig } from "@/components/shared/RecordCreateForm";

export const metadata = { title: "Add VIP Contact" };

const fields: CreateFieldConfig[] = [
  { name: "person_id", label: "Person ID", type: "text", required: true, helper: "Link this VIP profile to an existing person record." },
  { name: "contact_type", label: "Contact type", type: "select", required: true, options: [
    { label: "Investor", value: "Investor" }, { label: "Diplomat", value: "Diplomat" }, { label: "Government", value: "Government" }, { label: "Media", value: "Media" }, { label: "Corporate", value: "Corporate" }, { label: "Academic", value: "Academic" }, { label: "Development partner", value: "Development_partner" },
  ] },
  { name: "title", label: "Title", type: "text" },
  { name: "organisation", label: "Organisation", type: "text" },
  { name: "country", label: "Country", type: "text" },
  { name: "relationship_owner", label: "Relationship owner", type: "text" },
  { name: "engagement_notes", label: "Engagement notes", type: "textarea", fullWidth: true },
  { name: "notes", label: "Notes", type: "textarea", fullWidth: true },
];

export default function NewVipPage() {
  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/vips" label="VIP contacts" />
      <PageHeader title="Add VIP contact" subtitle="Register an investor, diplomat, official or media contact" />
      <RecordCreateForm endpoint="/api/vips" redirectTo="/vips" submitLabel="Create VIP contact" fields={fields} />
    </div>
  );
}
