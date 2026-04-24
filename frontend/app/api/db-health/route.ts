import { NextResponse }     from "next/server";
import { createAdminClient } from "@/lib/supabase";

const TABLES = [
  "person", "organisation", "event", "event_role",
  "attendance", "pitch", "diagnostic", "grant_capital",
  "mel_report", "eso_partner", "staging_import", "audit_log",
];

export async function GET() {
  const supabase = createAdminClient();
  const results: Record<string, number | string> = {};

  for (const table of TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    results[table] = error ? `ERROR: ${error.message}` : (count ?? 0);
  }

  // Sample 3 attendance rows to check FK structure
  const { data: attSample } = await supabase
    .from("attendance")
    .select("attendance_id, person_id, event_id, role_at_event, attended")
    .limit(3);

  // Sample 3 person rows
  const { data: personSample } = await supabase
    .from("person")
    .select("person_id, full_name, email_primary, import_status")
    .limit(3);

  // Sample 3 event rows
  const { data: eventSample } = await supabase
    .from("event")
    .select("event_id, name, edition_year")
    .limit(3);

  return NextResponse.json({
    table_counts: results,
    samples: {
      attendance: attSample ?? [],
      person:     personSample ?? [],
      event:      eventSample ?? [],
    },
  }, { status: 200 });
}
