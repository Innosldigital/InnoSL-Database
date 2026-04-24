interface Props { person: any }

export function PersonContact({ person }: Props) {
  const contacts = [
    { label: "Primary email",   value: person.email_primary,   warn: false },
    { label: "Secondary email", value: person.email_secondary, warn: false },
    { label: "Primary phone",   value: person.phone_primary,   warn: !person.phone_primary?.startsWith("+232") },
    { label: "Secondary phone", value: person.phone_secondary, warn: false },
    { label: "NIN",             value: person.nin ? "••••••••" : null, warn: !person.nin },
    { label: "Location",        value: person.location,        warn: false },
    { label: "District",        value: person.district,        warn: false },
  ].filter((c) => c.value);

  return (
    <div className="isl-card">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Contact details</p>
      </div>
      <div>
        {contacts.map((c) => (
          <div key={c.label} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0">
            <div className="w-6 h-6 rounded-md bg-[#EDE8F8] flex items-center justify-center text-[10px] text-[#4A2FA0] flex-shrink-0">
              {c.label.includes("email") ? "@" : c.label.includes("phone") ? "📞" : c.label === "NIN" ? "🪪" : "📍"}
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{c.label}</p>
              <p className={`text-[11px] font-medium ${c.warn ? "text-amber-700" : "text-foreground"}`}>
                {c.value}
                {c.warn && " · needs verification"}
              </p>
            </div>
          </div>
        ))}
        {contacts.length === 0 && (
          <p className="px-4 py-4 text-[11px] text-muted-foreground">No contact details recorded.</p>
        )}
      </div>
    </div>
  );
}
