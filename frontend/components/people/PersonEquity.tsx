interface Props { person: any }

const FLAGS = [
  { key:"is_woman",             label:"Female beneficiary",    yes:"#FCE7F3", yesText:"#9D174D" },
  { key:"is_youth",             label:"Youth (15–35 yrs)",     yes:"#DBEAFE", yesText:"#1E40AF" },
  { key:"is_girl",              label:"Girl (under 18)",       yes:"#FCE7F3", yesText:"#9D174D" },
  { key:"is_aged",              label:"Aged (60+)",            yes:"#F1EFE8", yesText:"#444441" },
  { key:"is_pwd",               label:"PWD (disability)",      yes:"#FFEDD5", yesText:"#9A3412" },
  { key:"is_repeat_beneficiary",label:"Repeat beneficiary",    yes:"#EDE8F8", yesText:"#4A2FA0" },
  { key:"is_outside_freetown",  label:"Outside Freetown",      yes:"#EAF3DE", yesText:"#27500A" },
];

export function PersonEquity({ person }: Props) {
  // Check if person has received capital
  const hasCapital = (person.grant_capital?.length ?? 0) > 0;

  return (
    <div className="isl-card">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Equity intelligence flags</p>
      </div>
      <div>
        {FLAGS.map((f) => {
          const active = person[f.key];
          return (
            <div key={f.key} className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border last:border-b-0">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                style={active ? { background: f.yes, color: f.yesText } : { background: "#F1EFE8", color: "#B4B2A9" }}
              >
                {active ? "✓" : "—"}
              </div>
              <span className="text-[11px] text-muted-foreground flex-1">{f.label}</span>
              <span
                className="text-[10px] font-medium"
                style={{ color: active ? f.yesText : "#B4B2A9" }}
              >
                {active ? "Confirmed" : "Not applicable"}
              </span>
            </div>
          );
        })}

        {/* Capital flag */}
        <div className="flex items-center gap-2.5 px-4 py-2.5">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
            style={hasCapital ? { background: "#EAF3DE", color: "#27500A" } : { background: "#FEE2E2", color: "#991B1B" }}
          >
            {hasCapital ? "✓" : "✗"}
          </div>
          <span className="text-[11px] text-muted-foreground flex-1">Capital received</span>
          <span className={`text-[10px] font-medium ${hasCapital ? "text-green-700" : "text-red-600"}`}>
            {hasCapital ? `${person.grant_capital.length} grant(s)` : "Not recorded yet"}
          </span>
        </div>
      </div>
    </div>
  );
}
