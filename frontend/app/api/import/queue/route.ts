import { NextResponse }      from "next/server";
import { auth }              from "@clerk/nextjs/server";
import { createAdminClient }  from "@/lib/supabase";

// GET /api/import/queue — return all staging records for the queue page
export async function GET() {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("staging_import")
      .select("staging_id, source_name, import_batch, target_table, import_status, reviewed_by, reviewed_at, created_at, raw_data")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    // Attach row_count from raw_data length without sending the full payload
    const items = (data ?? []).map((row: any) => ({
      staging_id:    row.staging_id,
      source_name:   row.source_name,
      import_batch:  row.import_batch,
      target_table:  row.target_table,
      import_status: row.import_status,
      reviewed_by:   row.reviewed_by ?? null,
      created_at:    row.created_at,
      row_count:     Array.isArray(row.raw_data) ? row.raw_data.length : null,
    }));

    return NextResponse.json(items);
  } catch (e: any) {
    console.error("Queue fetch error:", e.message);
    return NextResponse.json([]);
  }
}
