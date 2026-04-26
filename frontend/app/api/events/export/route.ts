import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import Papa from "papaparse";

const TEMPLATE_COLS = ["name","event_type","programme","edition_year","date_start","date_end","venue","city","funder","total_registered","total_attended","female_count","youth_count"] as const;

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  if (new URL(req.url).searchParams.get("template") === "1") {
    return new NextResponse(Papa.unparse({ fields: [...TEMPLATE_COLS], data: [] }), {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="template-events.csv"`,
      },
    });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event")
    .select("isl_ref,name,event_type,programme,edition_year,date_start,date_end,venue,city,funder,total_registered,total_attended,female_count,youth_count");

  if (error) return new NextResponse("Database error", { status: 500 });

  return new NextResponse(Papa.unparse(data ?? []), {
    headers: {
      "Content-Type":        "text/csv",
      "Content-Disposition": `attachment; filename="innovationsl-events-${Date.now()}.csv"`,
    },
  });
}
