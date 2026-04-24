"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  person: any;
}

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say", "Unknown"] as const;
const AGE_GROUPS = ["Girl", "Youth", "Adult", "Aged", "Unknown"] as const;
const RECORD_STATUSES = ["Active", "Inactive", "Merged", "Quarantined"] as const;

export function PersonEditForm({ person }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: person.full_name ?? "",
    preferred_name: person.preferred_name ?? "",
    gender: person.gender ?? "Unknown",
    age_group: person.age_group ?? "Unknown",
    nationality: person.nationality ?? "Sierra Leonean",
    email_primary: person.email_primary ?? "",
    email_secondary: person.email_secondary ?? "",
    phone_primary: person.phone_primary ?? "",
    phone_secondary: person.phone_secondary ?? "",
    location: person.location ?? "",
    district: person.district ?? "",
    region: person.region ?? "",
    nin: person.nin ?? "",
    notes: person.notes ?? "",
    record_status: person.record_status ?? "Active",
    is_pwd: Boolean(person.is_pwd),
  });

  function updateField(key: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch(`/api/people/${person.person_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to save person profile");
      }

      toast.success("Person profile updated");
      router.push(`/people/${person.person_id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save person profile");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="isl-card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Full name" required>
            <input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Preferred name">
            <input value={form.preferred_name} onChange={(e) => updateField("preferred_name", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Gender">
            <select value={form.gender} onChange={(e) => updateField("gender", e.target.value)} className={INPUT}>
              {GENDERS.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
            </select>
          </Field>
          <Field label="Age group">
            <select value={form.age_group} onChange={(e) => updateField("age_group", e.target.value)} className={INPUT}>
              {AGE_GROUPS.map((ageGroup) => <option key={ageGroup} value={ageGroup}>{ageGroup}</option>)}
            </select>
          </Field>
          <Field label="Nationality">
            <input value={form.nationality} onChange={(e) => updateField("nationality", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Record status">
            <select value={form.record_status} onChange={(e) => updateField("record_status", e.target.value)} className={INPUT}>
              {RECORD_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </Field>
        </div>
      </div>

      <div className="isl-card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Primary email">
            <input value={form.email_primary} onChange={(e) => updateField("email_primary", e.target.value)} className={INPUT} type="email" />
          </Field>
          <Field label="Secondary email">
            <input value={form.email_secondary} onChange={(e) => updateField("email_secondary", e.target.value)} className={INPUT} type="email" />
          </Field>
          <Field label="Primary phone">
            <input value={form.phone_primary} onChange={(e) => updateField("phone_primary", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Secondary phone">
            <input value={form.phone_secondary} onChange={(e) => updateField("phone_secondary", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Location">
            <input value={form.location} onChange={(e) => updateField("location", e.target.value)} className={INPUT} />
          </Field>
          <Field label="District">
            <input value={form.district} onChange={(e) => updateField("district", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Region">
            <input value={form.region} onChange={(e) => updateField("region", e.target.value)} className={INPUT} />
          </Field>
          <Field label="NIN">
            <input value={form.nin} onChange={(e) => updateField("nin", e.target.value)} className={INPUT} />
          </Field>
        </div>
      </div>

      <div className="isl-card p-5">
        <div className="flex items-center gap-2">
          <input
            id="is_pwd"
            type="checkbox"
            checked={form.is_pwd}
            onChange={(e) => updateField("is_pwd", e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <label htmlFor="is_pwd" className="text-[11px] text-foreground">Person with disability flag</label>
        </div>
        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className={`${INPUT} min-h-28 resize-y`}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isSaving || !form.full_name.trim()}
          className="rounded-lg bg-[#2D1B69] px-4 py-2 text-[11px] font-medium text-white transition-colors hover:bg-[#4A2FA0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/people/${person.person_id}`)}
          className="rounded-lg border border-border bg-white px-4 py-2 text-[11px] font-medium text-foreground hover:bg-muted/50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, required = false }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5 text-[11px]">
      <span className="font-medium text-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

const INPUT = "rounded-lg border border-border bg-white px-3 py-2 text-[11px] text-foreground outline-none transition-colors focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]/30";
