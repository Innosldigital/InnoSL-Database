"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const YEARS      = [2018,2019,2020,2021,2022,2023,2024,2025,2026];
const PROGRAMMES = ["All","FPN","FIW","GEW","OSVP","Incubation","Training","Dare2Aspire","SLEDP"];

interface Props {
  showYear?: boolean;
  showProgramme?: boolean;
}

export function YearFilter({ showYear = true, showProgramme = true }: Props) {
  const router      = useRouter();
  const pathname    = usePathname();
  const params      = useSearchParams();
  const activeYear  = params.get("year");
  const activeProg  = params.get("programme") ?? "All";

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString());
    if (value && value !== "All") p.set(key, value);
    else p.delete(key);
    router.push(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="isl-card flex items-center gap-3 px-4 py-2.5 flex-wrap">
      {showYear && (
        <>
          <span className="text-[11px] font-medium text-muted-foreground">Year:</span>
          <div className="flex gap-1.5 flex-wrap">
            {YEARS.map((y) => (
              <button
                key={y}
                onClick={() => setParam("year", activeYear === String(y) ? null : String(y))}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] border transition-colors",
                  activeYear === String(y)
                    ? "bg-[#2D1B69] text-white border-[#2D1B69]"
                    : "bg-white text-muted-foreground border-border hover:bg-[#EDE8F8] hover:text-[#4A2FA0]"
                )}
              >
                {y}
              </button>
            ))}
          </div>
        </>
      )}

      {showProgramme && (
        <>
          {showYear && <div className="h-4 w-px bg-border mx-1" />}

          <span className="text-[11px] font-medium text-muted-foreground">Programme:</span>
          <div className="flex gap-1.5 flex-wrap">
            {PROGRAMMES.map((p) => (
              <button
                key={p}
                onClick={() => setParam("programme", p)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] border font-medium transition-colors",
                  activeProg === p || (p === "All" && !params.get("programme"))
                    ? "bg-[#2D1B69] text-white border-[#2D1B69]"
                    : "bg-white text-muted-foreground border-border hover:bg-[#EDE8F8] hover:text-[#4A2FA0]"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
