import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RecordCreateForm, type CreateFieldConfig } from "@/components/shared/RecordCreateForm";

export const metadata = { title: "Add Cohort" };

const fields: CreateFieldConfig[] = [
  { name: "programme_name", label: "Programme name", type: "text", required: true },
  { name: "funder", label: "Funder", type: "text" },
  { name: "cohort_number", label: "Cohort number", type: "number" },
  { name: "year", label: "Year", type: "number" },
  { name: "start_date", label: "Start date", type: "date" },
  { name: "end_date", label: "End date", type: "date" },
  { name: "sector_focus", label: "Sector focus", type: "text" },
  { name: "stage_focus", label: "Stage focus", type: "text" },
  { name: "notes", label: "Notes", type: "textarea", fullWidth: true },
];

export default function NewCohortPage() {
  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/cohorts" label="Incubation & acceleration" />
      <PageHeader title="Add cohort" subtitle="Create an incubation or acceleration cohort record" />
      <RecordCreateForm endpoint="/api/cohorts" redirectTo="/cohorts" submitLabel="Create cohort" fields={fields} />
    </div>
  );
}
