"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { EquityDashboard } from "@/types";

interface Props { equity: EquityDashboard }

export function GenderSplitChart({ equity }: Props) {
  const female = equity.female_beneficiaries;
  const male   = (equity.total_beneficiaries ?? 0) - female;
  const femalePct = equity.total_beneficiaries > 0
    ? Math.round((female / equity.total_beneficiaries) * 100) : 0;
  const malePct = 100 - femalePct;

  const data = [
    { name: "Female", value: female, pct: femalePct, color: "#EC4899" },
    { name: "Male",   value: male,   pct: malePct,   color: "#38BDF8" },
  ];

  return (
    <div className="isl-card">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Gender split</p>
      </div>
      <div className="flex justify-center py-3">
        <ResponsiveContainer width={150} height={150}>
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={46} outerRadius={68} paddingAngle={2}>
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "0.5px solid #EDE8F8" }}
              formatter={(v: number, name: string) => [`${v} (${data.find(d => d.name === name)?.pct}%)`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 pb-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-[10px] text-muted-foreground">{d.name} {d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
