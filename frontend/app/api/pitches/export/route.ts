import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import Papa from "papaparse";

const TEMPLATE_COLS = ["event_id","person_id","org_id","category","pitch_stage","score","rank","winner_flag","finalist_flag","prize_amount","prize_currency","prize_type"] as const;

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  if (new URL(req.url).searchParams.get("template") === "1") {
    return new NextResponse(Papa.unparse({ fields: [...TEMPLATE_COLS], data: [] }), {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="template-pitches.csv"`,
      },
    });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pitch")
    .select("isl_ref,event_id,person_id,org_id,category,pitch_stage,score,rank,winner_flag,finalist_flag,prize_amount,prize_currency,prize_type,first_female_flag,repeat_pitcher_flag");

  if (error) return new NextResponse("Database error", { status: 500 });

  return new NextResponse(Papa.unparse(data ?? []), {
    headers: {
      "Content-Type":        "text/csv",
      "Content-Disposition": `attachment; filename="innovationsl-pitches-${Date.now()}.csv"`,
    },
  });
}
