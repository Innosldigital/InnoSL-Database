"use client";

const RULES = [
  { rule: "Name casing",        desc: "Title-case all full_name values",               active: true  },
  { rule: "Phone normalisation",desc: "+232 prefix · strip spaces and dashes",         active: true  },
  { rule: "Gender mapping",     desc: "M/F/Male/Female → schema enum",                 active: true  },
  { rule: "Duplicate detection",desc: "Fuzzy match on email + phone + name (80% threshold)", active: true  },
  { rule: "Email validation",   desc: "RFC 5321 format check",                         active: true  },
  { rule: "Age group inference",desc: "Compute from DOB if age_group is blank",        active: true  },
  { rule: "District lookup",    desc: "Map free-text location → SL district",          active: false },
  { rule: "NIN encryption",     desc: "AES-256 encrypt national ID on ingest",         active: false },
] as const;

export function CleaningRules() {
  return (
    <div className="isl-card">
      <div className="px-4 py-3 border-b border-border">
        <span className="text-[12px] font-semibold text-foreground">Cleaning rules</span>
      </div>
      <div className="divide-y divide-border">
        {RULES.map((r) => (
          <div key={r.rule} className="px-4 py-2.5 flex items-start gap-3">
            <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${r.active ? "bg-green-500" : "bg-muted-foreground/30"}`} />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className={`text-[11px] font-medium ${r.active ? "text-foreground" : "text-muted-foreground"}`}>{r.rule}</span>
              <span className="text-[10px] text-muted-foreground">{r.desc}</span>
            </div>
            <span className={`ml-auto text-[9px] font-medium flex-shrink-0 ${r.active ? "text-green-700" : "text-muted-foreground"}`}>
              {r.active ? "ON" : "OFF"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
