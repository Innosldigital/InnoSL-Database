import Link from "next/link";

const QUERIES = [
  { label: "Who was the first female FPN winner?", href: "/pitches?winner=true&programme=FPN" },
  { label: "Who has attended 3+ events?", href: "/people?is_repeat=true&sort=total_events_attended" },
  { label: "Repeat judges across events", href: "/events" },
  { label: "Female-led grant recipients", href: "/grants?woman_led=true" },
  { label: "Girls under 18 engaged", href: "/people?age_group=Girl" },
  { label: "Capital deployed to women-led businesses", href: "/grants?woman_led=true&sort=amount_usd" },
];

export function QuickQueries() {
  return (
    <div className="isl-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-[12px] font-medium">Quick queries</p>
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        {QUERIES.map((query) => (
          <Link
            key={query.label}
            href={query.href}
            className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-2 text-[11px] text-foreground transition-colors hover:border-[#7B5EA7] hover:bg-[#EDE8F8]"
          >
            <span>{query.label}</span>
            <span className="text-[10px] text-[#7B5EA7] opacity-0 transition-opacity group-hover:opacity-100">-&gt;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
