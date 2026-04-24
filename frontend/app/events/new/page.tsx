import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RecordCreateForm, type CreateFieldConfig } from "@/components/shared/RecordCreateForm";

export const metadata = { title: "Add Event" };

const fields: CreateFieldConfig[] = [
  { name: "name", label: "Event name", type: "text", required: true },
  { name: "event_type", label: "Event type", type: "select", required: true, options: [
    { label: "FPN", value: "FPN" }, { label: "FIW", value: "FIW" }, { label: "GEW", value: "GEW" }, { label: "OSVP", value: "OSVP" }, { label: "Dare2Aspire", value: "Dare2Aspire" }, { label: "EWC", value: "EWC" }, { label: "SLEDP", value: "SLEDP" }, { label: "NYEFF", value: "NYEFF" }, { label: "Other", value: "Other" },
  ] },
  { name: "programme", label: "Programme", type: "text" },
  { name: "edition_year", label: "Edition year", type: "number" },
  { name: "theme", label: "Theme", type: "text" },
  { name: "date_start", label: "Start date", type: "date" },
  { name: "date_end", label: "End date", type: "date" },
  { name: "venue", label: "Venue", type: "text" },
  { name: "city", label: "City", type: "text", defaultValue: "Freetown" },
  { name: "funder", label: "Funder", type: "text" },
  { name: "notes", label: "Notes", type: "textarea", fullWidth: true },
];

export default function NewEventPage() {
  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/events" label="Events" />
      <PageHeader title="Add event" subtitle="Create an event shell for attendance, roles and reporting" />
      <RecordCreateForm endpoint="/api/events" redirectTo="/events" submitLabel="Create event" fields={fields} />
    </div>
  );
}
