interface Props {
  diagnostic: any;
}

const FIELDS = [
  ["Overall score", "overall_score"],
  ["Strategic", "strategic_score"],
  ["Process", "process_score"],
  ["Support", "support_score"],
  ["Lendability", "lendability_score"],
  ["Market expansion", "market_expansion_score"],
  ["Production", "production_score"],
  ["Financial management", "financial_mgmt_score"],
  ["Operations", "operations_score"],
  ["Social impact", "social_impact_score"],
] as const;

export function DiagnosticScoreGrid({ diagnostic }: Props) {
  return (
    <div className="isl-card p-5">
      <p className="text-[12px] font-medium mb-3">Diagnostic scores</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {FIELDS.map(([label, key]) => (
          <div key={key} className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-[16px] font-semibold text-[#2D1B69]">
              {diagnostic[key] != null ? Number(diagnostic[key]).toFixed(1) : "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
