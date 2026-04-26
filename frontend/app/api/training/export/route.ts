import { auth }               from "@clerk/nextjs/server";
import { NextResponse }        from "next/server";
import { createAdminClient }   from "@/lib/supabase";
import Papa                    from "papaparse";

const EXPORT_COLS   = ["training_id","topic","session_type","session_date","format","facilitator","programme_funder","total_attended","female_count","youth_count","satisfaction_score","notes"] as const;
const TEMPLATE_COLS = ["topic","session_type","session_date","format","facilitator","programme_funder","total_attended","female_count","youth_count","satisfaction_score","notes"] as const;

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const isTemplate = new URL(req.url).searchParams.get("template") === "1";

  if (isTemplate) {
    return new NextResponse(Papa.unparse({ fields: [...TEMPLATE_COLS], data: [] }), {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="template-training-sessions.csv"`,
      },
    });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("training_session")
    .select(EXPORT_COLS.join(","))
    .order("session_date", { ascending: false, nullsFirst: false });

  if (error) return new NextResponse("Database error", { status: 500 });

  return new NextResponse(Papa.unparse(data ?? []), {
    headers: {
      "Content-Type":        "text/csv",
      "Content-Disposition": `attachment; filename="innovationsl-training-${Date.now()}.csv"`,
    },
  });
}
