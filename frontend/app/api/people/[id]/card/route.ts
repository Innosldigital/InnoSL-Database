import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const supabase = createAdminClient();
  const { data: person, error } = await supabase
    .from("person")
    .select(`
      *,
      organisation!left(name, sector)
    `)
    .eq("person_id", params.id)
    .single();

  if (error || !person) return new NextResponse("Person not found", { status: 404 });

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${person.full_name} | Innovation SL Profile Card</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f3fa; padding: 32px; }
          .card { max-width: 760px; margin: 0 auto; border-radius: 18px; overflow: hidden; background: white; border: 1px solid #ddd7f0; }
          .hero { background: linear-gradient(135deg, #2D1B69 0%, #4A2FA0 60%, #7B5EA7 100%); color: white; padding: 28px; }
          .ref { opacity: 0.8; font-size: 12px; margin-top: 4px; }
          .body { padding: 24px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .item { border: 1px solid #e6e1f5; border-radius: 12px; padding: 14px; }
          .label { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; }
          .value { font-size: 14px; font-weight: 600; color: #1f2937; margin-top: 6px; word-break: break-word; }
          .wide { grid-column: 1 / -1; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="hero">
            <h1>${person.full_name}</h1>
            <div class="ref">${person.isl_ref ?? "-"}</div>
          </div>
          <div class="body">
            <div class="item"><div class="label">Preferred name</div><div class="value">${person.preferred_name ?? "-"}</div></div>
            <div class="item"><div class="label">Gender</div><div class="value">${person.gender ?? "-"}</div></div>
            <div class="item"><div class="label">Age group</div><div class="value">${person.age_group ?? "-"}</div></div>
            <div class="item"><div class="label">Nationality</div><div class="value">${person.nationality ?? "-"}</div></div>
            <div class="item"><div class="label">Primary email</div><div class="value">${person.email_primary ?? "-"}</div></div>
            <div class="item"><div class="label">Primary phone</div><div class="value">${person.phone_primary ?? "-"}</div></div>
            <div class="item"><div class="label">Location</div><div class="value">${person.location ?? "-"}</div></div>
            <div class="item"><div class="label">District</div><div class="value">${person.district ?? "-"}</div></div>
            <div class="item"><div class="label">Organisation</div><div class="value">${person.organisation?.name ?? "-"}</div></div>
            <div class="item"><div class="label">Sector</div><div class="value">${person.organisation?.sector ?? "-"}</div></div>
            <div class="item"><div class="label">First programme</div><div class="value">${person.first_programme ?? "-"}</div></div>
            <div class="item"><div class="label">Events attended</div><div class="value">${person.total_events_attended ?? 0}</div></div>
            <div class="item wide"><div class="label">Notes</div><div class="value">${person.notes ?? "-"}</div></div>
          </div>
        </div>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
