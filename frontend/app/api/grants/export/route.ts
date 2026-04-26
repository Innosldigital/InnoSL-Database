import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import Papa from "papaparse";

const TEMPLATE_COLS = ["funder","programme","grant_type","amount_local","amount_usd","currency","disbursement_date","recipient_gender","recipient_youth","woman_led_business","repayment_status"] as const;

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  if (new URL(req.url).searchParams.get("template") === "1") {
    return new NextResponse(Papa.unparse({ fields: [...TEMPLATE_COLS], data: [] }), {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="template-grants.csv"`,
      },
    });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("grant_capital")
    .select("isl_ref,funder,programme,grant_type,amount_local,amount_usd,currency,disbursement_date,recipient_gender,recipient_youth,woman_led_business,repayment_status");

  if (error) return new NextResponse("Database error", { status: 500 });

  return new NextResponse(Papa.unparse(data ?? []), {
    headers: {
      "Content-Type":        "text/csv",
      "Content-Disposition": `attachment; filename="innovationsl-grants-${Date.now()}.csv"`,
    },
  });
}
