"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLOURS = ["#2D1B69", "#38BDF8", "#22C55E", "#C9821A", "#EC4899", "#8B5CF6", "#F97316"];

const FALLBACK = [
  { sector: "Tech / Digital", count: 28 },
  { sector: "AgriFood",       count: 19 },
  { sector: "Creative",       count: 16 },
  { sector: "Health",         count: 12 },
  { sector: "Other",          count: 25 },
];

interface SectorRow { sector: string; count: number }
interface Props { sectors: SectorRow[] }

export function SectorBreakdownChart({ sectors }: Props) {
  const data = (sectors.length > 0 ? sectors : FALLBACK).map((s, i) => ({
    ...s,
    color: COLOURS[i % COLOURS.length],
  }));

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="isl-card">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Sector breakdown</p>
      </div>
      <div className="flex justify-center py-3">
        <ResponsiveContainer width={150} height={150}>
          <PieChart>
            <Pie data={data} dataKey="count" cx="50%" cy="50%" innerRadius={36} outerRadius={68} paddingAngle={2}>
              {data.map((d) => <Cell key={d.sector} fill={d.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "0.5px solid #EDE8F8" }}
              formatter={(v: number, name: string) => [`${v} (${total > 0 ? Math.round(v / total * 100) : 0}%)`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-1 px-4 pb-3">
        {data.map((d) => (
          <div key={d.sector} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-[10px] text-muted-foreground flex-1">{d.sector}</span>
            <span className="text-[10px] font-medium text-foreground">
              {total > 0 ? Math.round(d.count / total * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
