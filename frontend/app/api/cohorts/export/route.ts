import { auth }               from "@clerk/nextjs/server";
import { NextResponse }        from "next/server";
import { createAdminClient }   from "@/lib/supabase";
import Papa                    from "papaparse";

const EXPORT_COLS   = ["isl_ref","programme_name","cohort_number","year","start_date","end_date","funder","total_startups","graduated_count","jobs_created","eso_trained_flag","notes"] as const;
const TEMPLATE_COLS = ["programme_name","cohort_number","year","start_date","end_date","funder","total_startups","graduated_count","jobs_created","eso_trained_flag","notes"] as const;

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const isTemplate = new URL(req.url).searchParams.get("template") === "1";

  if (isTemplate) {
    return new NextResponse(Papa.unparse({ fields: [...TEMPLATE_COLS], data: [] }), {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="template-cohorts.csv"`,
      },
    });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cohort")
    .select(EXPORT_COLS.join(","))
    .order("year", { ascending: false, nullsFirst: false });

  if (error) return new NextResponse("Database error", { status: 500 });

  return new NextResponse(Papa.unparse(data ?? []), {
    headers: {
      "Content-Type":        "text/csv",
      "Content-Disposition": `attachment; filename="innovationsl-cohorts-${Date.now()}.csv"`,
    },
  });
}
