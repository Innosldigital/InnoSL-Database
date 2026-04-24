import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const supabase = createAdminClient();
  const [{ data: equity }, { data: years }, { data: capital }] = await Promise.all([
    supabase.from("v_equity_dashboard").select("*").single(),
    supabase.from("v_beneficiaries_by_year").select("*").order("year", { ascending: true }),
    supabase.from("v_capital_summary").select("*"),
  ]);

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Innovation SL Dashboard Summary</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #1f2937; }
          h1 { color: #2D1B69; margin-bottom: 8px; }
          h2 { margin-top: 28px; color: #2D1B69; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #d7d7e2; padding: 8px; text-align: left; font-size: 13px; }
          th { background: #f5f2fd; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
          .card { border: 1px solid #d7d7e2; border-radius: 10px; padding: 14px; }
          .label { font-size: 11px; text-transform: uppercase; color: #6b7280; }
          .value { font-size: 22px; font-weight: 700; color: #2D1B69; margin-top: 6px; }
        </style>
      </head>
      <body>
        <h1>Innovation SL Dashboard Summary</h1>
        <p>Generated ${new Date().toISOString()}</p>

        <div class="grid">
          <div class="card"><div class="label">Total beneficiaries</div><div class="value">${equity?.total_beneficiaries ?? "-"}</div></div>
          <div class="card"><div class="label">Female beneficiaries</div><div class="value">${equity?.female_beneficiaries ?? "-"}</div></div>
          <div class="card"><div class="label">Youth beneficiaries</div><div class="value">${equity?.youth_beneficiaries ?? "-"}</div></div>
        </div>

        <h2>Beneficiaries by Year</h2>
        <table>
          <thead><tr><th>Year</th><th>Total</th><th>Female</th><th>Male</th><th>Youth</th></tr></thead>
          <tbody>
            ${(years ?? []).map((row: any) => `<tr><td>${row.year}</td><td>${row.total}</td><td>${row.female}</td><td>${row.male}</td><td>${row.youth}</td></tr>`).join("")}
          </tbody>
        </table>

        <h2>Capital Summary</h2>
        <table>
          <thead><tr><th>Funder</th><th>Grant type</th><th>Disbursements</th><th>Total USD</th><th>USD to women</th></tr></thead>
          <tbody>
            ${(capital ?? []).map((row: any) => `<tr><td>${row.funder ?? "-"}</td><td>${row.grant_type ?? "-"}</td><td>${row.disbursements ?? "-"}</td><td>${row.total_usd ?? "-"}</td><td>${row.usd_to_women ?? "-"}</td></tr>`).join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
