import { NextResponse }      from "next/server";
import { auth }             from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { staging_id } = await req.json();

  try {
    const supabase = createAdminClient();
    await supabase
      .from("staging_import")
      .update({ import_status: "Rejected", reviewed_by: userId, reviewed_at: new Date().toISOString() })
      .eq("staging_id", staging_id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}