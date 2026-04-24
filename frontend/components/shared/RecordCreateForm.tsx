"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface CreateFieldConfig {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "date" | "checkbox";
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  helper?: string;
  fullWidth?: boolean;
  defaultValue?: string | number | boolean;
  step?: string;
}

interface Props {
  endpoint: string;
  redirectTo: string;
  submitLabel: string;
  fields: CreateFieldConfig[];
}

export function RecordCreateForm({ endpoint, redirectTo, submitLabel, fields }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const initialValues = useMemo(() => {
    const base: Record<string, string | number | boolean> = {};
    for (const field of fields) {
      if (field.type === "checkbox") base[field.name] = Boolean(field.defaultValue);
      else base[field.name] = field.defaultValue ?? "";
    }
    return base;
  }, [fields]);

  const [values, setValues] = useState<Record<string, string | number | boolean>>(initialValues);

  function updateValue(name: string, value: string | number | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const missingRequired = fields.find((field) => {
      if (!field.required) return false;
      const value = values[field.name];
      return field.type === "checkbox" ? false : String(value ?? "").trim() === "";
    });

    if (missingRequired) {
      toast.error(`${missingRequired.label} is required`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to create record");
      }

      toast.success("Record created");
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create record");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="isl-card p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className={field.fullWidth ? "md:col-span-2 flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
            <span className="text-[11px] font-medium text-foreground">
              {field.label}
              {field.required ? " *" : ""}
            </span>
            {renderField(field, values[field.name], updateValue)}
            {field.helper && <span className="text-[10px] text-muted-foreground">{field.helper}</span>}
          </label>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-[#2D1B69] px-4 py-2 text-[11px] font-medium text-white transition-colors hover:bg-[#4A2FA0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.push(redirectTo)}
          className="rounded-lg border border-border bg-white px-4 py-2 text-[11px] font-medium text-foreground hover:bg-muted/50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function renderField(
  field: CreateFieldConfig,
  value: string | number | boolean | undefined,
  updateValue: (name: string, value: string | number | boolean) => void
) {
  if (field.type === "textarea") {
    return (
      <textarea
        value={String(value ?? "")}
        onChange={(e) => updateValue(field.name, e.target.value)}
        placeholder={field.placeholder}
        className={`${INPUT} min-h-28 resize-y`}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={String(value ?? "")}
        onChange={(e) => updateValue(field.name, e.target.value)}
        className={INPUT}
      >
        <option value="">Select...</option>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }

  if (field.type === "checkbox") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => updateValue(field.name, e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        <span className="text-[11px] text-foreground">Enabled</span>
      </div>
    );
  }

  return (
    <input
      type={field.type}
      value={String(value ?? "")}
      step={field.step}
      onChange={(e) => {
        if (field.type === "number") {
          updateValue(field.name, e.target.value === "" ? "" : Number(e.target.value));
        } else {
          updateValue(field.name, e.target.value);
        }
      }}
      placeholder={field.placeholder}
      className={INPUT}
    />
  );
}

const INPUT = "rounded-lg border border-border bg-white px-3 py-2 text-[11px] text-foreground outline-none transition-colors focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]/30";
