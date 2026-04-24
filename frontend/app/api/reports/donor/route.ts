import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { csvResponse } from "@/lib/report-export";

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const funder = new URL(req.url).searchParams.get("funder");
  const supabase = createAdminClient();
  let query = supabase
    .from("mel_report")
    .select("*")
    .order("period_start", { ascending: false });

  if (funder) query = query.eq("funder", funder);

  const { data, error } = await query;
  if (error) return new NextResponse("Database error", { status: 500 });
  return csvResponse(`innovationsl-donor-report-${Date.now()}.csv`, data ?? []);
}
