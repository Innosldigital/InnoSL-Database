import { NextResponse }     from "next/server";
import { auth }             from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase";

const TABLES = [
  "person","organisation","event","event_role",
  "attendance","pitch","diagnostic","grant_capital",
  "mel_report","eso_partner","cohort","training_session",
  "staging_import","audit_log",
];

export async function GET() {
  // Protect this endpoint — table counts are sensitive operational data
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const supabase = createAdminClient();
  const results: Record<string, number | string> = {};

  for (const table of TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    results[table] = error ? `ERROR: ${error.message}` : (count ?? 0);
  }

  const [attSample, personSample, eventSample] = await Promise.all([
    supabase.from("attendance").select("attendance_id,person_id,event_id,role_at_event,attended").limit(3),
    supabase.from("person").select("person_id,isl_ref,full_name,email_primary,import_status").limit(3),
    supabase.from("event").select("event_id,isl_ref,name,edition_year").limit(3),
  ]);

  return NextResponse.json({
    table_counts: results,
    samples: {
      attendance: attSample.data ?? [],
      person:     personSample.data ?? [],
      event:      eventSample.data ?? [],
    },
  });
}