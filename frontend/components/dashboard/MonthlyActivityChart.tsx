"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface Props {
  data: { events: number[]; participants: number[] };
  year: number;
}

export function MonthlyActivityChart({ data, year }: Props) {
  const chartData = MONTHS.map((month, i) => ({
    month,
    events:       data.events[i],
    participants: data.participants[i],
  }));

  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Programme activity — monthly {year}</p>
        <a href="/events" className="text-[10px] text-[#1E40AF] hover:underline">Full calendar →</a>
      </div>
      <div className="px-4 py-3">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE8F8" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9490a8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9490a8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "0.5px solid #EDE8F8" }} />
            <Line dataKey="events"       name="Events"       stroke="#2D1B69" strokeWidth={2} dot={{ r: 3, fill: "#2D1B69" }} activeDot={{ r: 4 }} />
            <Line dataKey="participants" name="Participants"  stroke="#38BDF8" strokeWidth={2} dot={{ r: 3, fill: "#38BDF8" }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 px-4 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#2D1B69]" />
          <span className="text-[10px] text-muted-foreground">Events</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
          <span className="text-[10px] text-muted-foreground">Participants</span>
        </div>
      </div>
    </div>
  );
}
