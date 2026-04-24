import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RecordCreateForm, type CreateFieldConfig } from "@/components/shared/RecordCreateForm";

export const metadata = { title: "New Diagnostic" };

const fields: CreateFieldConfig[] = [
  { name: "org_id", label: "Organisation ID", type: "text", required: true },
  { name: "diag_date", label: "Diagnostic date", type: "date", required: true },
  { name: "tool_used", label: "Tool used", type: "select", required: true, options: [
    { label: "ISL Scorecard", value: "ISL_Scorecard" }, { label: "SME TA Diagnosis", value: "SME_TA_Diagnosis" }, { label: "ILO Acceleration", value: "ILO_Acceleration" }, { label: "Lendability Index", value: "Lendability_Index" }, { label: "VIRAL Assessment", value: "VIRAL_Assessment" }, { label: "Other", value: "Other" },
  ] },
  { name: "assessor", label: "Assessor", type: "text" },
  { name: "overall_score", label: "Overall score", type: "number", step: "0.01" },
  { name: "strategic_score", label: "Strategic score", type: "number", step: "0.01" },
  { name: "process_score", label: "Process score", type: "number", step: "0.01" },
  { name: "support_score", label: "Support score", type: "number", step: "0.01" },
  { name: "lendability_score", label: "Lendability score", type: "number", step: "0.01" },
  { name: "tier", label: "Tier", type: "text" },
  { name: "gap_priority", label: "Gap priority", type: "text" },
  { name: "ta_recommended", label: "TA recommended", type: "textarea", fullWidth: true },
  { name: "woman_led_flag", label: "Woman-led flag", type: "checkbox" },
  { name: "youth_led_flag", label: "Youth-led flag", type: "checkbox" },
  { name: "notes", label: "Notes", type: "textarea", fullWidth: true },
];

export default function NewDiagnosticPage() {
  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/diagnostics" label="Diagnostics" />
      <PageHeader title="New diagnostic" subtitle="Create a business diagnostic or scorecard entry" />
      <RecordCreateForm endpoint="/api/diagnostics" redirectTo="/diagnostics" submitLabel="Create diagnostic" fields={fields} />
    </div>
  );
}
