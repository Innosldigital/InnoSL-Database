import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RecordCreateForm, type CreateFieldConfig } from "@/components/shared/RecordCreateForm";

export const metadata = { title: "Add Person" };

const fields: CreateFieldConfig[] = [
  { name: "full_name", label: "Full name", type: "text", required: true, placeholder: "Enter full name" },
  { name: "preferred_name", label: "Preferred name", type: "text" },
  { name: "gender", label: "Gender", type: "select", options: [
    { label: "Male", value: "Male" }, { label: "Female", value: "Female" }, { label: "Non-binary", value: "Non-binary" }, { label: "Prefer not to say", value: "Prefer not to say" }, { label: "Unknown", value: "Unknown" },
  ] },
  { name: "age_group", label: "Age group", type: "select", options: [
    { label: "Girl", value: "Girl" }, { label: "Youth", value: "Youth" }, { label: "Adult", value: "Adult" }, { label: "Aged", value: "Aged" }, { label: "Unknown", value: "Unknown" },
  ] },
  { name: "nationality", label: "Nationality", type: "text", defaultValue: "Sierra Leonean" },
  { name: "email_primary", label: "Primary email", type: "text" },
  { name: "phone_primary", label: "Primary phone", type: "text" },
  { name: "location", label: "Location", type: "text" },
  { name: "district", label: "District", type: "text" },
  { name: "region", label: "Region", type: "text" },
  { name: "notes", label: "Notes", type: "textarea", fullWidth: true },
];

export default function NewPersonPage() {
  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/people" label="People" />
      <PageHeader title="Add person" subtitle="Create a new beneficiary, judge, speaker, exhibitor or contact record" />
      <RecordCreateForm endpoint="/api/people" redirectTo="/people" submitLabel="Create person" fields={fields} />
    </div>
  );
}
