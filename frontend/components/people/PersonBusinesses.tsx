interface Props { person: any }

export function PersonBusinesses({ person }: Props) {
  const org = person.organisation;
  if (!org) return null;

  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Businesses & ventures</p>
      </div>
      <div className="p-4 flex gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#EDE8F8] flex items-center justify-center text-xl flex-shrink-0">
          {org.sector?.toLowerCase().includes("agri") ? "🌾" : "💡"}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[13px] font-medium text-foreground">{org.name}</p>
            <span className="pill bg-blue-100 text-blue-800">{org.sector ?? "—"}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{org.description ?? "No description recorded."}</p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {org.woman_led   && <span className="pill pill-female">Women-led</span>}
            {org.youth_led   && <span className="pill pill-youth">Youth-led</span>}
            {org.stage       && <span className="pill bg-[#EDE8F8] text-[#4A2FA0]">{org.stage}</span>}
            {org.location    && <span className="pill bg-slate-100 text-slate-700">{org.location}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
