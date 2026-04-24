"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { CapitalSummary } from "@/types";
import { fmtUSD }             from "@/lib/utils";

interface Props { data: CapitalSummary[]; }

// Aggregate capital by year for chart (static fallback until DB populated)
const FALLBACK = [
  { year:"2018", osvp:11, undp:0,  ilo:0,  other:3  },
  { year:"2019", osvp:17, undp:0,  ilo:0,  other:5  },
  { year:"2020", osvp:10, undp:0,  ilo:0,  other:4  },
  { year:"2021", osvp:15, undp:0,  ilo:0,  other:6  },
  { year:"2022", osvp:12, undp:20, ilo:0,  other:5  },
  { year:"2023", osvp:14, undp:30, ilo:15, other:8  },
  { year:"2024", osvp:16, undp:40, ilo:25, other:10 },
  { year:"2025", osvp:18, undp:50, ilo:35, other:12 },
];

export function CapitalChart({ data }: Props) {
  const totalUSD = data.reduce((a, r) => a + (r.total_usd ?? 0), 0);
  const toWomen  = data.reduce((a, r) => a + (r.usd_to_women ?? 0), 0);

  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Capital deployed by programme (USD $K)</p>
        <a href="/grants" className="text-[10px] text-[#1E40AF] hover:underline">Full breakdown →</a>
      </div>
      <div className="px-4 py-3">
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={FALLBACK} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE8F8" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#9490a8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9490a8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}K`} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "0.5px solid #EDE8F8" }}
              formatter={(v: number) => [`$${v}K`]}
            />
            <Bar dataKey="osvp"  name="OSVP prizes"  stackId="a" fill="#2D1B69" />
            <Bar dataKey="undp"  name="UNDP grants"  stackId="a" fill="#38BDF8" />
            <Bar dataKey="ilo"   name="ILO/ITC seed" stackId="a" fill="#22C55E" />
            <Bar dataKey="other" name="Other"         stackId="a" fill="#C9821A" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 px-4 pb-3 gap-2">
        <div className="bg-[#EDE8F8] rounded-lg p-2.5">
          <p className="text-[9px] text-[#7B5EA7] uppercase tracking-wide">Total deployed</p>
          <p className="text-[15px] font-semibold text-[#2D1B69]">{totalUSD > 0 ? fmtUSD(totalUSD) : "$284K"}</p>
        </div>
        <div className="bg-pink-50 rounded-lg p-2.5">
          <p className="text-[9px] text-pink-600 uppercase tracking-wide">To women-led</p>
          <p className="text-[15px] font-semibold text-pink-800">{toWomen > 0 ? fmtUSD(toWomen) : "$153K"}</p>
        </div>
      </div>
    </div>
  );
}
