import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { csvResponse } from "@/lib/report-export";

export async function GET() {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("v_first_female_winners")
    .select("*")
    .order("event_date", { ascending: true });

  if (error) return new NextResponse("Database error", { status: 500 });
  return csvResponse(`innovationsl-female-firsts-${Date.now()}.csv`, data ?? []);
}
