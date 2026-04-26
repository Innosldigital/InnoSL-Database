import { auth }               from "@clerk/nextjs/server";
import { NextResponse }        from "next/server";
import { createAdminClient }   from "@/lib/supabase";
import Papa                    from "papaparse";

const EXPORT_COLS   = ["isl_ref","name","eso_type","city","country","contact_person","email","phone","website","funder","active_partner","trained_by_isl","training_date"] as const;
const TEMPLATE_COLS = ["name","eso_type","city","country","contact_person","email","phone","website","funder","active_partner","trained_by_isl","training_date"] as const;

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const isTemplate = new URL(req.url).searchParams.get("template") === "1";

  if (isTemplate) {
    return new NextResponse(Papa.unparse({ fields: [...TEMPLATE_COLS], data: [] }), {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="template-eso-partners.csv"`,
      },
    });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("eso_partner")
    .select(EXPORT_COLS.join(","))
    .order("name", { ascending: true });

  if (error) return new NextResponse("Database error", { status: 500 });

  return new NextResponse(Papa.unparse(data ?? []), {
    headers: {
      "Content-Type":        "text/csv",
      "Content-Disposition": `attachment; filename="innovationsl-esos-${Date.now()}.csv"`,
    },
  });
}
