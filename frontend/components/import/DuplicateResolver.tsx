// ============================================================
//  DuplicateResolver
// ============================================================
"use client";
import { useState } from "react";
import { toast }    from "sonner";

interface Props { batchId: string; onContinue: () => void; }

const MOCK_DUPES = [
  { id:"1", name:"Hawanatu Sesay",    confidence:94, matchType:"Email exact",    existing:"FPN Turtle pitch + OSVP applicant" },
  { id:"2", name:"Mariama Mbayoh",   confidence:91, matchType:"Phone exact",    existing:"Kam Rent Ya (OSVP 2024) + FPN pitcher" },
  { id:"3", name:"Isha Abdulai Turay",confidence:78, matchType:"Name fuzzy",    existing:"The Crescent App (OSVP 2024) + Dare2Aspire" },
  { id:"4", name:"Fatmata Kargbo",   confidence:72, matchType:"Name only",      existing:"FPN Fempreneure pitcher + GREEN GENERATION" },
];

export function DuplicateResolver({ batchId, onContinue }: Props) {
  const [resolved, setResolved] = useState<Record<string, "merge"|"keep">>({});

  function resolve(id: string, action: "merge"|"keep") {
    setResolved((r) => ({ ...r, [id]: action }));
    toast.success(action === "merge" ? "Records will be merged" : "Records kept separate");
  }

  return (
    <div>
      <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-800 font-medium">
        {MOCK_DUPES.length} possible duplicate records detected — review before approving
      </div>

      {MOCK_DUPES.map((d) => {
        const action = resolved[d.id];
        return (
          <div key={d.id} className="border-b border-border px-4 py-3 hover:bg-[#F5F2FD] transition-colors">
            <div className="flex items-start gap-3">
              <div className={`w-1 self-stretch rounded flex-shrink-0 ${d.confidence >= 90 ? "bg-red-400" : "bg-amber-400"}`} />
              <div className="flex-1">
                <p className="text-[11px] font-medium text-foreground">
                  {d.name} — {d.confidence >= 90 ? "high" : "medium"} confidence ({d.confidence}%)
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Existing: {d.existing}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Match type: {d.matchType}</p>
              </div>
              {action ? (
                <span className={`text-[10px] font-medium px-2 py-1 rounded-md ${action === "merge" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}`}>
                  {action === "merge" ? "✓ Will merge" : "✓ Keep separate"}
                </span>
              ) : (
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => resolve(d.id, "merge")}
                    className="px-2.5 py-1 text-[9px] bg-green-100 text-green-800 rounded-md hover:bg-green-200 font-medium transition-colors">
                    Merge
                  </button>
                  <button onClick={() => resolve(d.id, "keep")}
                    className="px-2.5 py-1 text-[9px] bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 font-medium transition-colors">
                    Keep separate
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="px-4 py-3 border-t border-border">
        <button
          onClick={() => { onContinue(); toast.success("Duplicates resolved — ready for approval"); }}
          className="px-4 py-2 bg-[#15803D] text-white rounded-lg text-[11px] font-medium hover:bg-green-700 transition-colors"
        >
          Duplicates resolved → approve records
        </button>
      </div>
    </div>
  );
}
