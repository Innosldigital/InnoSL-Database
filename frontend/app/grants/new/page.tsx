import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RecordCreateForm, type CreateFieldConfig } from "@/components/shared/RecordCreateForm";

export const metadata = { title: "Add Grant" };

const fields: CreateFieldConfig[] = [
  { name: "funder", label: "Funder", type: "text", required: true },
  { name: "grant_type", label: "Grant type", type: "select", required: true, options: [
    { label: "Grant", value: "Grant" }, { label: "Prize", value: "Prize" }, { label: "Seed capital", value: "Seed_capital" }, { label: "Loan", value: "Loan" }, { label: "In-kind", value: "In-kind" }, { label: "Other", value: "Other" },
  ] },
  { name: "person_id", label: "Person ID", type: "text", helper: "Optional. Link directly to a person record." },
  { name: "org_id", label: "Organisation ID", type: "text", helper: "Optional. Link directly to an organisation record." },
  { name: "programme", label: "Programme", type: "text" },
  { name: "amount_usd", label: "Amount (USD)", type: "number", step: "0.01" },
  { name: "currency", label: "Currency", type: "text", defaultValue: "USD" },
  { name: "disbursement_date", label: "Disbursement date", type: "date" },
  { name: "repayment_status", label: "Repayment status", type: "text" },
  { name: "notes", label: "Notes", type: "textarea", fullWidth: true },
];

export default function NewGrantPage() {
  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/grants" label="Grants & capital" />
      <PageHeader title="Add grant" subtitle="Register a grant, prize, seed capital or loan disbursement" />
      <RecordCreateForm endpoint="/api/grants" redirectTo="/grants" submitLabel="Create grant" fields={fields} />
    </div>
  );
}
