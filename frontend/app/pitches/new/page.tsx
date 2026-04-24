import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RecordCreateForm, type CreateFieldConfig } from "@/components/shared/RecordCreateForm";

export const metadata = { title: "Add Pitch" };

const fields: CreateFieldConfig[] = [
  { name: "event_id", label: "Event ID", type: "text", required: true },
  { name: "person_id", label: "Person ID", type: "text", required: true },
  { name: "org_id", label: "Organisation ID", type: "text" },
  { name: "category", label: "Category", type: "text" },
  { name: "pitch_stage", label: "Pitch stage", type: "text" },
  { name: "score", label: "Score", type: "number", step: "0.01" },
  { name: "rank", label: "Rank", type: "number" },
  { name: "winner_flag", label: "Winner flag", type: "checkbox" },
  { name: "finalist_flag", label: "Finalist flag", type: "checkbox" },
  { name: "prize_amount", label: "Prize amount", type: "number", step: "0.01" },
  { name: "prize_currency", label: "Prize currency", type: "text", defaultValue: "USD" },
  { name: "prize_type", label: "Prize type", type: "select", options: [
    { label: "Grant", value: "Grant" }, { label: "Prize", value: "Prize" }, { label: "Seed capital", value: "Seed_capital" }, { label: "Loan", value: "Loan" }, { label: "In-kind", value: "In-kind" }, { label: "Other", value: "Other" },
  ] },
  { name: "idea_description", label: "Idea description", type: "textarea", fullWidth: true },
  { name: "notes", label: "Notes", type: "textarea", fullWidth: true },
];

export default function NewPitchPage() {
  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/pitches" label="Pitch competitions" />
      <PageHeader title="Add pitch" subtitle="Register a pitch application, result or prize outcome" />
      <RecordCreateForm endpoint="/api/pitches" redirectTo="/pitches" submitLabel="Create pitch" fields={fields} />
    </div>
  );
}
