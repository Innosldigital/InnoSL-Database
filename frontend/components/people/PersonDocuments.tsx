interface Props { person: any }

export function PersonDocuments({ person }: Props) {
  const pitches: any[] = person.pitch ?? [];
  const docs = pitches
    .filter((p) => p.pitch_deck_link)
    .map((p) => ({
      name: `${p.event?.event_type ?? "Event"} ${p.event?.edition_year ?? ""} — ${p.organisation?.name ?? "Pitch deck"}`,
      link: p.pitch_deck_link,
      type: "Pitch deck",
      meta: p.event?.name ?? "",
      colour: "bg-[#FCE7F3] text-[#9D174D]",
    }));

  if (docs.length === 0) return null;

  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Linked documents from Drive</p>
      </div>
      <div>
        {docs.map((doc, i) => (
          <a
            key={i}
            href={doc.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-[#F5F2FD] transition-colors"
          >
            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${doc.colour}`}>
              PP
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-foreground truncate">{doc.name}</p>
              <p className="text-[9px] text-muted-foreground">{doc.meta}</p>
            </div>
            <span className="pill bg-[#EDE8F8] text-[#4A2FA0] flex-shrink-0">{doc.type}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
