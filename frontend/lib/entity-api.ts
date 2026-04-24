import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase";

export async function requireUser() {
  const { userId } = auth();
  if (!userId) return { userId: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { userId, response: null };
}

export function makeIslRef(prefix: string) {
  return `ISL-${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function insertWithAudit(table: string, payload: Record<string, unknown>, performedBy: string, recordIdField: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select(recordIdField)
    .single();

  if (error) return { data: null, error };

  const insertedRecord = data as unknown as Record<string, unknown> | null;

  await supabase.from("audit_log").insert({
    table_name: table,
    record_id: insertedRecord?.[recordIdField],
    action: "INSERT",
    new_values: payload,
    performed_by: performedBy,
  });

  return { data, error: null };
}

export function nullIfBlank(value: unknown) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
