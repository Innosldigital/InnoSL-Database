"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { CapitalSummary } from "@/types";
import { fmtUSD } from "@/lib/utils";

interface Props { data: CapitalSummary[] }

export function CapitalChart({ data }: Props) {
  const totalUSD = data.reduce((a, r) => a + (r.total_usd ?? 0), 0);
  const toWomen  = data.reduce((a, r) => a + (r.usd_to_women ?? 0), 0);

  // Build year-grouped chart data from real grant records
  const byYear: Record<number, Record<string, number>> = {};
  for (const row of data) {
    // group by funder into chart series
    // The capital summary view groups by funder + grant_type
    // We show top 4 funders as series
  }

  // Fallback chart: show by funder if no year breakdown available
  const chartData = data.length > 0
    ? data.slice(0, 8).map(r => ({
        name: r.funder?.slice(0, 8) ?? "Other",
        amount: Math.round(r.total_usd ?? 0),
        to_women: Math.round(r.usd_to_women ?? 0),
      }))
    : [];

  const isEmpty = totalUSD === 0;

  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Capital deployed by funder (USD)</p>
        <a href="/grants" className="text-[10px] text-[#1E40AF] hover:underline">Full breakdown →</a>
      </div>
      <div className="px-4 py-3">
        {isEmpty ? (
          <div className="h-[170px] flex flex-col items-center justify-center text-center gap-2">
            <p className="text-[11px] text-muted-foreground">No grant data yet</p>
            <a href="/import" className="text-[10px] text-[#1E40AF] hover:underline">
              Import 06_grants.csv to populate this chart →
            </a>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData} margin={{ top:4, right:4, bottom:0, left:-20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE8F8" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize:10,fill:"#9490a8"}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize:10,fill:"#9490a8"}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}K`} />
              <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:"0.5px solid #EDE8F8"}}
                formatter={(v:number)=>[`$${v.toLocaleString()}`]} />
              <Bar dataKey="amount"   name="Total"    fill="#2D1B69" radius={[3,3,0,0]} />
              <Bar dataKey="to_women" name="To women" fill="#EC4899" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="grid grid-cols-2 px-4 pb-3 gap-2">
        <div className="bg-[#EDE8F8] rounded-lg p-2.5">
          <p className="text-[9px] text-[#7B5EA7] uppercase tracking-wide">Total deployed</p>
          <p className="text-[15px] font-semibold text-[#2D1B69]">
            {isEmpty ? "—" : fmtUSD(totalUSD)}
          </p>
        </div>
        <div className="bg-pink-50 rounded-lg p-2.5">
          <p className="text-[9px] text-pink-600 uppercase tracking-wide">To women-led</p>
          <p className="text-[15px] font-semibold text-pink-800">
            {isEmpty ? "—" : fmtUSD(toWomen)}
          </p>
        </div>
      </div>
    </div>
  );
}