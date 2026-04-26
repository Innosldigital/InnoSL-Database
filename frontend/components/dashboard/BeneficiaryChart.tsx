"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import type { BeneficiaryByYear } from "@/types";

interface Props {
  data:       BeneficiaryByYear[];
  activeYear?: number;
}

export function BeneficiaryChart({ data, activeYear }: Props) {
  const title = activeYear
    ? `Beneficiaries by year — ${activeYear} highlighted`
    : "Beneficiaries by year — all programmes";

  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">{title}</p>
        <a href="/people" className="text-[10px] text-[#1E40AF] hover:underline">Data table →</a>
      </div>
      <div className="px-4 py-3">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE8F8" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 10, fill: "#9490a8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9490a8" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "0.5px solid #EDE8F8" }}
              cursor={{ fill: "#EDE8F8" }}
            />
            <Bar dataKey="female" name="Female" radius={[3,3,0,0]}>
              {data.map((d) => (
                <Cell
                  key={d.year}
                  fill={activeYear === d.year ? "#EC4899" : "#2D1B69"}
                  opacity={activeYear && activeYear !== d.year ? 0.35 : 1}
                />
              ))}
            </Bar>
            <Bar dataKey="male" name="Male" radius={[3,3,0,0]}>
              {data.map((d) => (
                <Cell
                  key={d.year}
                  fill={activeYear === d.year ? "#0EA5E9" : "#38BDF8"}
                  opacity={activeYear && activeYear !== d.year ? 0.35 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 px-4 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#2D1B69]" />
          <span className="text-[10px] text-muted-foreground">Female</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
          <span className="text-[10px] text-muted-foreground">Male</span>
        </div>
        {activeYear && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#EC4899]" />
            <span className="text-[10px] text-muted-foreground">{activeYear} selected</span>
          </div>
        )}
      </div>
    </div>
  );
}
