"use client";

import type { ImportStep } from "@/app/import/page";

const STEPS = [
  { label: "Upload",     desc: "Drop file or connect Drive" },
  { label: "Map fields", desc: "Match columns to schema"    },
  { label: "Validate",   desc: "Check data quality"         },
  { label: "Duplicates", desc: "Resolve conflicts"          },
  { label: "Approve",    desc: "Push to database"           },
] as const;

interface Props {
  current:  ImportStep;
  onSelect: (step: ImportStep) => void;
}

export function PipelineSteps({ current, onSelect }: Props) {
  return (
    <div className="isl-card p-0 overflow-hidden">
      <div className="flex">
        {STEPS.map((s, i) => {
          const idx    = i as ImportStep;
          const done   = i < current;
          const active = i === current;
          return (
            <button
              key={s.label}
              onClick={() => onSelect(idx)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 px-2 border-r border-border last:border-r-0 transition-colors
                ${active ? "bg-[#2D1B69] text-white" : done ? "bg-[#EDE8F8] text-[#2D1B69] hover:bg-[#DDD6F5]" : "bg-white text-muted-foreground hover:bg-muted/40"}`}
            >
              <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center mb-0.5
                ${active ? "bg-white text-[#2D1B69]" : done ? "bg-[#2D1B69] text-white" : "bg-muted text-muted-foreground"}`}>
                {done ? "✓" : i + 1}
              </span>
              <span className={`text-[11px] font-semibold ${active ? "text-white" : ""}`}>{s.label}</span>
              <span className={`text-[9px] hidden sm:block ${active ? "text-white/70" : "text-muted-foreground"}`}>{s.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
