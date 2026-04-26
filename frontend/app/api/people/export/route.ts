import { NextResponse }     from "next/server";
import { auth }             from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase";
import Papa                  from "papaparse";

const TEMPLATE_COLS = ["full_name","gender","age_group","nationality","phone_primary","email_primary","location","district","is_woman","is_youth","is_girl","is_aged","is_pwd","first_engagement_date","first_programme"] as const;

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const url        = new URL(req.url);
  const isWoman    = url.searchParams.get("is_woman") === "true";
  const isTemplate = url.searchParams.get("template") === "1";

  if (isTemplate) {
    return new NextResponse(Papa.unparse({ fields: [...TEMPLATE_COLS], data: [] }), {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="template-people.csv"`,
      },
    });
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("person")
    .select("isl_ref,full_name,gender,age_group,nationality,phone_primary,email_primary,location,district,is_woman,is_youth,is_girl,is_aged,is_pwd,is_repeat_beneficiary,first_engagement_date,first_programme,total_events_attended,total_programmes,completeness_score")
    .eq("record_status", "Active")
    .order("first_engagement_date", { ascending: false });

  if (isWoman) query = query.eq("is_woman", true);

  const { data, error } = await query;
  if (error) return new NextResponse("Database error", { status: 500 });

  return new NextResponse(Papa.unparse(data ?? []), {
    headers: {
      "Content-Type":        "text/csv",
      "Content-Disposition": `attachment; filename="innovationsl-people-${Date.now()}.csv"`,
    },
  });
}
