import { NextResponse }       from "next/server";
import { auth }               from "@clerk/nextjs/server";
import { createAdminClient }   from "@/lib/supabase";

// Mirror of the detection logic from approve/route.ts
const normCol = (c: string) => c.toLowerCase().replace(/[\s_\-]+/g, "");
function detectTable(records: Record<string, unknown>[]): string {
  if (!records.length) return "person";
  const cols = Object.keys(records[0]).map(normCol);
  const has = (k: string) => cols.some(c => c.includes(normCol(k)));
  if (has("roleatEvent") || (has("personid") && has("eventid") && has("attended"))) return "attendance";
  if (has("topic") && (has("facilitator") || has("sessiontype") || has("speakername") || has("activitytype"))) return "training_session";
  if (
    has("diagdate") || has("toolused") || has("lendability") || has("loanpurpose") ||
    has("tabusiness") || has("tafinancial") || (has("tahr") && has("tamarketing")) ||
    (has("overallscore") && has("strategicscore")) || (has("assessmentdate") && has("assessor"))
  ) return "diagnostic";
  if (
    has("kpiname") || has("baseline") || (has("target") && has("actual") && has("period")) ||
    has("totalrespondents") || (has("programme") && has("year") && has("pctfemale"))
  ) return "mel_report";
  if (has("esotype") || has("trainedbyisl") || has("activepartner")) return "eso_partner";
  if (has("winnerflag") || has("pitchstage") || has("firstfemaleflag")) return "pitch";
  if (has("granttype") || has("disbursementdate") || has("amountusd")) return "grant_capital";
  if (has("eventtype") || has("editionyear") || (has("datestart") && has("venue"))) return "event";
  if (has("orgtype") || has("regnum") || has("founderp") || (has("womanled") && !has("tabusiness") && !has("tafinancial"))) return "organisation";
  return "person";
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { source_name, source_file, import_batch, raw_data } = await req.json();

  if (!import_batch || !raw_data?.length) {
    return NextResponse.json({ error: "import_batch and raw_data are required" }, { status: 400 });
  }

  // Detect the target table from column names right on intake
  const target_table = detectTable(raw_data);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("staging_import")
    .insert({
      source_name:   source_name  ?? "Manual upload",
      source_file:   source_file  ?? "",
      import_batch:  import_batch,
      target_table,   // real table name, not "pending"
      raw_data:       raw_data,
      import_status: "Staging",
    })
    .select("staging_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staging_id: data.staging_id, target_table });
}