import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import Papa from "papaparse";

export async function GET() {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("grant_capital")
    .select("isl_ref,funder,programme,grant_type,amount_local,amount_usd,currency,disbursement_date,recipient_gender,recipient_youth,woman_led_business,repayment_status");

  if (error) return new NextResponse("Database error", { status: 500 });

  return new NextResponse(Papa.unparse(data ?? []), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="innovationsl-grants-${Date.now()}.csv"`,
    },
  });
}
