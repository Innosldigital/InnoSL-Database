"use client";

import type { GrantCapital, CapitalSummary } from "@/types";
import { fmtUSD, fmtDate } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface SumProps { summary: CapitalSummary[] }

export function GrantsSummary({ summary }: SumProps) {
  const totalUSD = summary.reduce((a, r) => a + (r.total_usd ?? 0), 0);
  const toWomen = summary.reduce((a, r) => a + (r.usd_to_women ?? 0), 0);
  const pctWomen = totalUSD > 0 ? Math.round((toWomen / totalUSD) * 100) : 0;
  const disbursements = summary.reduce((a, r) => a + (r.disbursements ?? 0), 0);

  return (
    <div className="isl-card">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total deployed", value: fmtUSD(totalUSD), colour: "#2D1B69" },
          { label: "To women-led biz", value: fmtUSD(toWomen), colour: "#EC4899" },
          { label: "% to women", value: `${pctWomen}%`, colour: "#22C55E" },
          { label: "Total disbursements", value: String(disbursements), colour: "#38BDF8" },
        ].map((s) => (
          <div key={s.label} className="relative border-b border-r border-border py-4 text-center last:border-r-0 lg:border-b-0">
            <div className="absolute left-0 right-0 top-0 h-[2px]" style={{ background: s.colour }} />
            <p className="mt-1 text-[20px] font-semibold" style={{ color: s.colour }}>{s.value}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TableProps { grants: GrantCapital[]; womanLed: boolean }

export function GrantsTable({ grants, womanLed }: TableProps) {
  const searchParams = useSearchParams();
  const filtered = womanLed ? grants.filter((g) => g.woman_led_business) : grants;
  const params = new URLSearchParams(searchParams.toString());

  if (womanLed) params.delete("woman_led");
  else params.set("woman_led", "true");

  const womenLedHref = params.toString() ? `?${params.toString()}` : "?";

  return (
    <div className="isl-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">{filtered.length}</span> grant records
        </p>
        <Link
          href={womenLedHref}
          className={`pill cursor-pointer text-[10px] ${womanLed ? "bg-[#2D1B69] text-white" : "bg-pink-100 text-pink-800 hover:bg-pink-200"}`}
        >
          Women-led only
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              {["Recipient", "Organisation", "Funder", "Type", "Amount (USD)", "Date", "Status", "Flags"].map((heading) => (
                <th key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-muted-foreground">No grants found.</td>
              </tr>
            ) : filtered.map((grant) => (
              <tr key={grant.grant_id}>
                <td>
                  {grant.person_id ? (
                    <Link href={`/people/${grant.person_id}`} className="text-[11px] font-medium text-[#1E40AF] hover:underline">
                      {grant.person?.full_name ?? "-"}
                    </Link>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">-</span>
                  )}
                </td>
                <td className="max-w-[120px] truncate text-[11px] text-muted-foreground">{grant.organisation?.name ?? "-"}</td>
                <td className="max-w-[100px] truncate text-[11px] text-muted-foreground">{grant.funder}</td>
                <td><span className="pill bg-[#EDE8F8] text-[#4A2FA0]">{grant.grant_type}</span></td>
                <td className="text-[11px] font-medium text-green-700">{grant.amount_usd ? fmtUSD(grant.amount_usd) : "-"}</td>
                <td className="text-[11px] text-muted-foreground">{fmtDate(grant.disbursement_date)}</td>
                <td className="text-[11px] text-muted-foreground">{grant.repayment_status ?? "-"}</td>
                <td>
                  <div className="flex gap-1">
                    {grant.woman_led_business && <span className="pill bg-pink-100 text-pink-800">Women-led</span>}
                    {grant.recipient_youth && <span className="pill bg-blue-100 text-blue-800">Youth</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
