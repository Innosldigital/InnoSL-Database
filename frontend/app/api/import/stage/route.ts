import { NextResponse }      from "next/server";
import { auth }              from "@clerk/nextjs/server";
import { createAdminClient }  from "@/lib/supabase";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { source_name, source_file, import_batch, raw_data } = await req.json();

  if (!import_batch || !raw_data?.length) {
    return NextResponse.json({ error: "import_batch and raw_data are required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("staging_import")
    .insert({
      source_name:  source_name  ?? "Manual upload",
      source_file:  source_file  ?? "",
      import_batch: import_batch,
      target_table: "pending",
      raw_data:     raw_data,
      import_status: "Staging",
    })
    .select("staging_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staging_id: data.staging_id });
}
