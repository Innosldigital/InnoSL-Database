import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RecordCreateForm, type CreateFieldConfig } from "@/components/shared/RecordCreateForm";

export const metadata = { title: "Add Partner" };

const fields: CreateFieldConfig[] = [
  { name: "name", label: "Partner name", type: "text", required: true },
  { name: "eso_type", label: "Partner type", type: "text" },
  { name: "country", label: "Country", type: "text", defaultValue: "Sierra Leone" },
  { name: "city", label: "City", type: "text" },
  { name: "trained_by_isl", label: "Trained by ISL", type: "checkbox" },
  { name: "training_date", label: "Training date", type: "date" },
  { name: "funder", label: "Funder", type: "text" },
  { name: "contact_person", label: "Contact person", type: "text" },
  { name: "website", label: "Website", type: "text" },
  { name: "notes", label: "Notes", type: "textarea", fullWidth: true },
];

export default function NewEsoPage() {
  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/esos" label="ESO partners" />
      <PageHeader title="Add partner" subtitle="Register an ESO, donor or partner organisation" />
      <RecordCreateForm endpoint="/api/esos" redirectTo="/esos" submitLabel="Create partner" fields={fields} />
    </div>
  );
}
