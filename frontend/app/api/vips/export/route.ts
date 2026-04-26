import { auth }               from "@clerk/nextjs/server";
import { NextResponse }        from "next/server";
import { createAdminClient }   from "@/lib/supabase";
import Papa                    from "papaparse";

const EXPORT_COLS   = ["isl_ref","person_id","title","contact_type","organisation","country","relationship_owner","events_attended","last_engaged","notes"] as const;
const TEMPLATE_COLS = ["person_id","title","contact_type","organisation","country","relationship_owner","events_attended","last_engaged","notes"] as const;

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const isTemplate = new URL(req.url).searchParams.get("template") === "1";

  if (isTemplate) {
    return new NextResponse(Papa.unparse({ fields: [...TEMPLATE_COLS], data: [] }), {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="template-vip-contacts.csv"`,
      },
    });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vip_contact")
    .select(EXPORT_COLS.join(","))
    .order("last_engaged", { ascending: false, nullsFirst: false });

  if (error) return new NextResponse("Database error", { status: 500 });

  return new NextResponse(Papa.unparse(data ?? []), {
    headers: {
      "Content-Type":        "text/csv",
      "Content-Disposition": `attachment; filename="innovationsl-vips-${Date.now()}.csv"`,
    },
  });
}
