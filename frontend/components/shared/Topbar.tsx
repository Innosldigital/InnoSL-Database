"use client";
import { useRouter }        from "next/navigation";
import { UserButton }       from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Search }           from "lucide-react";

export function Topbar() {
  const router = useRouter();
  const [q, setQ]       = useState("");
  const [dateStr, setDateStr] = useState<string>("");

  // Populate date only on the client to avoid server/client HTML mismatch
  useEffect(() => {
    setDateStr(
      new Date().toLocaleDateString("en-SL", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
      })
    );
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/people?search=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="isl-topbar">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-4 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#38BDF8] flex items-center justify-center text-[#2D1B69] font-semibold text-[11px] flex-shrink-0">
          ISL
        </div>
        <div className="hidden sm:block">
          <p className="text-white text-[13px] font-medium leading-tight">Innovation SL</p>
          <p className="text-[#BAE6FD] text-[10px] leading-tight">Ecosystem Intelligence Platform</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex items-center flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-3.5 h-3.5" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people, events, businesses…"
            className="w-full bg-white/10 border border-white/20 rounded-lg
                       pl-8 pr-3 py-1.5 text-white text-xs placeholder:text-white/40
                       focus:outline-none focus:ring-1 focus:ring-[#38BDF8]/60"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-3">
        {dateStr && (
          <span className="text-white/40 text-[11px] hidden sm:block">{dateStr}</span>
        )}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-7 h-7 ring-2 ring-[#38BDF8]/40",
            },
          }}
        />
      </div>
    </header>
  );
}
