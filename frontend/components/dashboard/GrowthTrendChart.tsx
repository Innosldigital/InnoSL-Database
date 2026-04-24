"use client";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { BeneficiaryByYear } from "@/types";

const CAPITAL_BY_YEAR: Record<number, number> = {
  2018: 11, 2019: 17, 2020: 14, 2021: 21,
  2022: 37, 2023: 67, 2024: 91, 2025: 115, 2026: 80,
};

interface Props { data: BeneficiaryByYear[]; }

export function GrowthTrendChart({ data }: Props) {
  const chartData = data.map((d) => ({ ...d, capital: CAPITAL_BY_YEAR[d.year] ?? null }));

  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Beneficiary growth trend — 9-year overview (2018–2026)</p>
        <a href="/reports" className="text-[10px] text-[#1E40AF] hover:underline">Full analysis →</a>
      </div>
      <div className="px-4 py-3">
        <ResponsiveContainer width="100%" height={150}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#2D1B69" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2D1B69" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gFemale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#38BDF8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE8F8" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#9490a8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9490a8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "0.5px solid #EDE8F8" }} />
            <Area type="monotone" dataKey="total"   name="Total"      stroke="#2D1B69" strokeWidth={2} fill="url(#gTotal)"  dot={{ r: 3, fill: "#2D1B69" }} />
            <Area type="monotone" dataKey="female"  name="Female"     stroke="#38BDF8" strokeWidth={2} fill="url(#gFemale)" dot={{ r: 3, fill: "#38BDF8" }} />
            <Line  type="monotone" dataKey="capital" name="Capital ($K)" stroke="#C9821A" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3, fill: "#C9821A" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 px-4 pb-3">
        {[
          { color: "#2D1B69", label: "Total beneficiaries" },
          { color: "#38BDF8", label: "Female beneficiaries" },
          { color: "#C9821A", label: "Capital deployed ($K)" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
