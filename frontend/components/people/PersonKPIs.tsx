interface Props { person: any }

export function PersonKPIs({ person }: Props) {
  const kpis = [
    { label: "Programmes attended",  value: person.total_programmes ?? 0 },
    { label: "Events engaged",       value: person.total_events_attended ?? 0 },
    { label: "Businesses founded",   value: person.organisation ? 1 : 0 },
    { label: "First engaged",        value: person.first_engagement_date?.slice(0,4) ?? "—" },
  ];

  return (
    <div className="isl-card">
      <div className="grid grid-cols-4">
        {kpis.map((k, i) => (
          <div
            key={k.label}
            className="text-center py-4 border-r border-border last:border-r-0"
          >
            <p className="text-[20px] font-semibold text-[#2D1B69]">{k.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
