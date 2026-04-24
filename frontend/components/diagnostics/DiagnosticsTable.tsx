import type { Diagnostic } from "@/types";
import { fmtDate } from "@/lib/utils";
import Link from "next/link";

interface Props { diagnostics: Diagnostic[] }

const TIER_COLOUR: Record<string, string> = {
  "High Priority": "bg-red-100 text-red-700",
  "Low Priority": "bg-green-100 text-green-700",
  "Tier 1": "bg-amber-100 text-amber-700",
  "Tier 2": "bg-blue-100 text-blue-700",
  "Tier 3": "bg-purple-100 text-purple-700",
};

export function DiagnosticsTable({ diagnostics }: Props) {
  return (
    <div className="isl-card">
      <div className="px-4 py-2.5 border-b border-border">
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">{diagnostics.length}</span> diagnostic records
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              {["Business", "Sector", "Tool", "Date", "Overall", "Strategic", "Process", "Support", "Lendability", "Tier", "Flags"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {diagnostics.length === 0 ? (
              <tr><td colSpan={11} className="text-center py-10 text-muted-foreground">No diagnostics found.</td></tr>
            ) : diagnostics.map((d) => (
              <tr key={d.diag_id}>
                <td>
                  <Link href={`/diagnostics/${d.diag_id}`} className="text-[11px] font-medium text-[#1E40AF] hover:underline truncate max-w-[120px] block">
                    {d.organisation?.name ?? "-"}
                  </Link>
                </td>
                <td className="text-[11px] text-muted-foreground">{d.organisation?.sector ?? "-"}</td>
                <td><span className="pill bg-[#EDE8F8] text-[#4A2FA0] text-[8px]">{d.tool_used?.replace("_", " ")}</span></td>
                <td className="text-[11px] text-muted-foreground">{fmtDate(d.diag_date)}</td>
                <td className="text-[11px] font-medium text-[#2D1B69]">{d.overall_score?.toFixed(1) ?? "-"}</td>
                <td className="text-[11px] text-muted-foreground">{d.strategic_score?.toFixed(1) ?? "-"}</td>
                <td className="text-[11px] text-muted-foreground">{d.process_score?.toFixed(1) ?? "-"}</td>
                <td className="text-[11px] text-muted-foreground">{d.support_score?.toFixed(1) ?? "-"}</td>
                <td className="text-[11px] text-muted-foreground">{d.lendability_score?.toFixed(1) ?? "-"}</td>
                <td>
                  {d.tier
                    ? <span className={`pill ${TIER_COLOUR[d.tier] ?? "bg-slate-100 text-slate-700"}`}>{d.tier}</span>
                    : <span className="text-[11px] text-muted-foreground">-</span>
                  }
                </td>
                <td>
                  <div className="flex gap-1">
                    {d.woman_led_flag && <span className="pill bg-pink-100 text-pink-800">W</span>}
                    {d.youth_led_flag && <span className="pill bg-blue-100 text-blue-800">Y</span>}
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
