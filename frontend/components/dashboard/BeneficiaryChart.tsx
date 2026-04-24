"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { BeneficiaryByYear } from "@/types";

interface Props { data: BeneficiaryByYear[]; }

export function BeneficiaryChart({ data }: Props) {
  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Beneficiaries by year — all programmes</p>
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
            <Bar dataKey="female" name="Female" fill="#2D1B69" radius={[3,3,0,0]} />
            <Bar dataKey="male"   name="Male"   fill="#38BDF8" radius={[3,3,0,0]} />
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
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#EDE8F8] border border-[#7B5EA7]" />
          <span className="text-[10px] text-muted-foreground">Youth</span>
        </div>
      </div>
    </div>
  );
}
