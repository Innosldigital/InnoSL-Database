import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RecordCreateForm, type CreateFieldConfig } from "@/components/shared/RecordCreateForm";

export const metadata = { title: "Add Session" };

const fields: CreateFieldConfig[] = [
  { name: "topic", label: "Topic", type: "text", required: true },
  { name: "event_id", label: "Linked event ID", type: "text" },
  { name: "programme_funder", label: "Programme funder", type: "text" },
  { name: "session_type", label: "Session type", type: "text" },
  { name: "facilitator", label: "Facilitator", type: "text" },
  { name: "session_date", label: "Session date", type: "date" },
  { name: "duration_hours", label: "Duration hours", type: "number", step: "0.1" },
  { name: "format", label: "Format", type: "text", defaultValue: "In-person" },
  { name: "notes", label: "Notes", type: "textarea", fullWidth: true },
];

export default function NewTrainingPage() {
  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/training" label="Training" />
      <PageHeader title="Add session" subtitle="Create a training or workshop session" />
      <RecordCreateForm endpoint="/api/training" redirectTo="/training" submitLabel="Create session" fields={fields} />
    </div>
  );
}
