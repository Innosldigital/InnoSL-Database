// ============================================================
//  PipelineSteps
// ============================================================
"use client";
import { cn } from "@/lib/utils";
import type { ImportStep } from "@/app/import/page";

const STEPS = [
  { label:"1 · Upload",       sub:"Source selected" },
  { label:"2 · Map fields",   sub:"7 fields mapped" },
  { label:"3 · Validate",     sub:"12 issues found",  warn:true },
  { label:"4 · Duplicates",   sub:"5 possible matches",warn:true },
  { label:"5 · Approve",      sub:"Awaiting review" },
];

interface PipelineProps { current: ImportStep; onSelect: (s: ImportStep) => void; }

export function PipelineSteps({ current, onSelect }: PipelineProps) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-border">
      {STEPS.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(i as ImportStep)}
          className={cn(
            "pipe-step text-center flex-1 py-3 px-1 transition-all border-r border-border last:border-r-0",
            i === current ? "active" : i < current ? "done" : ""
          )}
        >
          <p className={cn("text-[11px] font-medium", i < current ? "text-green-700" : i === current ? "text-[#4A2FA0]" : "text-muted-foreground")}>
            {s.label}
          </p>
          <p className={cn("text-[9px] mt-0.5", s.warn ? "text-amber-600" : "text-muted-foreground")}>
            {s.sub}
          </p>
        </button>
      ))}
    </div>
  );
}

// ============================================================
//  ConnectedSources
// ============================================================
const SOURCES = [
  { icon:"GF", label:"GEW 2025 Pitchers Form",       meta:"Google Forms · 47 new responses",  status:"47 pending",  sClass:"bg-amber-100 text-amber-800",  bg:"bg-green-100 text-green-800" },
  { icon:"GF", label:"FIW 2025 Event Registration",  meta:"Google Forms · 412 records",        status:"Imported",    sClass:"bg-green-100 text-green-800",  bg:"bg-blue-100 text-blue-800" },
  { icon:"XL", label:"Entrepreneur Database.xlsx",   meta:"Google Drive · 700+ rows · 2018+",  status:"Partial",     sClass:"bg-amber-100 text-amber-800",  bg:"bg-amber-100 text-amber-800" },
  { icon:"XL", label:"OSVP 2024 Master Sheet",       meta:"Google Drive · 58 coded entries",   status:"Needs mapping",sClass:"bg-red-100 text-red-700",    bg:"bg-red-100 text-red-700" },
  { icon:"XL", label:"GEW 2024 Registration.xlsx",   meta:"Google Drive · 300+ rows",          status:"Imported",    sClass:"bg-green-100 text-green-800",  bg:"bg-green-100 text-green-800" },
];

export function ConnectedSources() {
  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Connected data sources</p>
        <button className="text-[10px] text-[#1E40AF] hover:underline">+ Add source</button>
      </div>
      {SOURCES.map((s) => (
        <div key={s.label} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-[#F5F2FD] cursor-pointer transition-colors">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${s.bg}`}>
            {s.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-foreground truncate">{s.label}</p>
            <p className="text-[9px] text-muted-foreground">{s.meta}</p>
          </div>
          <span className={`pill flex-shrink-0 ${s.sClass}`}>{s.status}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
//  CleaningRules
// ============================================================
const RULES = [
  { icon:"⧉", label:"Duplicate detection",    desc:"Match by email → phone → fuzzy name. Flag if confidence > 80%.",  bg:"bg-pink-100" },
  { icon:"♀", label:"Gender auto-detection",  desc:"Infer from Sierra Leonean name bank. Flag uncertain. Never overwrite.", bg:"bg-pink-100" },
  { icon:"📞",label:"Phone normaliser",        desc:"Standardise all to +232 format. Remove spaces and dashes.",           bg:"bg-green-100" },
  { icon:"Aa", label:"Name standardiser",      desc:"Title-case all names. Strip extra spaces. Flag < 3 chars.",           bg:"bg-blue-100" },
  { icon:"🎂",label:"Age group classifier",    desc:"Auto-tag: Girl <18 · Youth 18–35 · Adult 36–59 · Aged 60+.",         bg:"bg-amber-100" },
  { icon:"🔗",label:"Event auto-linker",       desc:"Match event name in source to Event table. Flag no-match.",           bg:"bg-purple-100" },
  { icon:"✗", label:"Orphan quarantine",       desc:"No attendance record without valid person_id and event_id.",          bg:"bg-red-100" },
  { icon:"%", label:"Completeness scoring",    desc:"Score 0–100 per record. Surface low scores in review queue.",         bg:"bg-green-100" },
];

export function CleaningRules() {
  const [toggles, setToggles] = useState<boolean[]>(RULES.map(() => true));

  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Cleaning rules engine</p>
        <button className="text-[10px] text-[#1E40AF] hover:underline">+ Add rule</button>
      </div>
      {RULES.map((r, i) => (
        <div key={r.label} className="flex items-start gap-3 px-4 py-2.5 border-b border-border last:border-b-0">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 ${r.bg}`}>{r.icon}</div>
          <div className="flex-1">
            <p className="text-[11px] font-medium text-foreground">{r.label}</p>
            <p className="text-[10px] text-muted-foreground">{r.desc}</p>
          </div>
          <button
            onClick={() => setToggles((t) => t.map((v, j) => j === i ? !v : v))}
            className={`w-8 h-4.5 rounded-full relative flex-shrink-0 mt-0.5 transition-colors ${toggles[i] ? "bg-[#4A2FA0]" : "bg-border"}`}
            style={{ height: 18, width: 32 }}
          >
            <span
              className="absolute top-[2px] w-3.5 h-3.5 bg-white rounded-full transition-all"
              style={{ left: toggles[i] ? 16 : 2 }}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

// Needs useState import
import { useState } from "react";

// ============================================================
//  CompletenessBar
// ============================================================
const SOURCES_PROGRESS = [
  { label:"2025–2026 records",      pct:91, colour:"#22C55E" },
  { label:"FIW 2025 registrations", pct:88, colour:"#22C55E" },
  { label:"GEW 2024 registrations", pct:74, colour:"#3B82F6" },
  { label:"Entrepreneur DB (2018+)",pct:62, colour:"#F59E0B" },
  { label:"OSVP records (all yrs)", pct:48, colour:"#F59E0B" },
  { label:"Dare2Aspire 2019",       pct:55, colour:"#F59E0B" },
  { label:"SLEDP cohort data",      pct:67, colour:"#3B82F6" },
  { label:"2018–2021 historical",   pct:38, colour:"#EF4444" },
  { label:"OSVP 2021 coded apps",   pct:12, colour:"#EF4444" },
];

export function CompletenessBar() {
  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Data completeness by source</p>
        <a href="/reports/data-health" className="text-[10px] text-[#1E40AF] hover:underline">Full report →</a>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 gap-x-8 gap-y-2">
        {SOURCES_PROGRESS.map((s) => (
          <div key={s.label} className="flex items-center gap-2.5">
            <span className="text-[10px] text-muted-foreground w-[180px] flex-shrink-0 truncate">{s.label}</span>
            <div className="flex-1 h-1.5 bg-[#EDE8F8] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width:`${s.pct}%`, background:s.colour }} />
            </div>
            <span className="text-[10px] font-medium w-8 text-right flex-shrink-0" style={{ color:s.colour }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
