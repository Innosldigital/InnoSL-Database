import Link from "next/link";

interface Props { person: any }

export function PersonScore({ person }: Props) {
  const score = person.completeness_score ?? 0;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  const items = [
    { label: "Name, gender, age group", done: !!person.full_name && person.gender !== "Unknown", pts: 20 },
    { label: "Programme history", done: (person.attendance?.length ?? 0) > 0, pts: 20 },
    { label: "Business record linked", done: !!person.organisation, pts: 20 },
    { label: "Equity flags computed", done: true, pts: 14 },
    { label: "Phone verified", done: !!person.phone_primary, pts: 10 },
    { label: "NIN recorded", done: !!person.nin, pts: 10 },
    { label: "Capital record linked", done: (person.grant_capital?.length ?? 0) > 0, pts: 6 },
  ];

  return (
    <div className="isl-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-medium">Record quality score</p>
        <Link href={`/people/${person.person_id}/edit`} className="text-[10px] text-[#1E40AF] hover:underline">
          Improve
        </Link>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center justify-center mb-3">
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="36" fill="none" stroke="#EDE8F8" strokeWidth="10" />
            <circle
              cx="45"
              cy="45"
              r="36"
              fill="none"
              stroke="#4A2FA0"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 45 45)"
            />
            <text x="45" y="49" textAnchor="middle" fontSize="18" fontWeight="600" fill="#2D1B69">{score}%</text>
          </svg>
        </div>

        <div className="space-y-0">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-b-0">
              <span className="text-[10px] text-muted-foreground flex-1">{item.label}</span>
              <span className={`text-[10px] font-medium ${item.done ? "text-green-700" : "text-red-600"}`}>
                {item.done ? `+${item.pts}` : `-${item.pts}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
