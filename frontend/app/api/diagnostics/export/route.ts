import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import Papa from "papaparse";

const TEMPLATE_COLS = ["org_id","assessor","diag_date","tool_used","strategic_score","process_score","support_score","overall_score","tier","lendability_score","gap_priority","ta_recommended","woman_led_flag","youth_led_flag"] as const;

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  if (new URL(req.url).searchParams.get("template") === "1") {
    return new NextResponse(Papa.unparse({ fields: [...TEMPLATE_COLS], data: [] }), {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="template-diagnostics.csv"`,
      },
    });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("diagnostic")
    .select("isl_ref,org_id,assessor,diag_date,tool_used,strategic_score,process_score,support_score,overall_score,tier,lendability_score,gap_priority,ta_recommended,woman_led_flag,youth_led_flag");

  if (error) return new NextResponse("Database error", { status: 500 });

  return new NextResponse(Papa.unparse(data ?? []), {
    headers: {
      "Content-Type":        "text/csv",
      "Content-Disposition": `attachment; filename="innovationsl-diagnostics-${Date.now()}.csv"`,
    },
  });
}
