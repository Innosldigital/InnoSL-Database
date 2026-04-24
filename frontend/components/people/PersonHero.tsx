import Link from "next/link";
import { getInitials, getAvatarColour, getPillClass } from "@/lib/utils";

interface Props { person: any; }

export function PersonHero({ person }: Props) {
  const { bg, text } = getAvatarColour(person.full_name);

  return (
    <div className="isl-card overflow-hidden">
      <div className="h-20 relative" style={{ background: "linear-gradient(135deg, #2D1B69 0%, #4A2FA0 60%, #7B5EA7 100%)" }}>
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        />
      </div>

      <div className="px-5 pb-4 relative">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-end gap-3">
            <div
              className="w-16 h-16 rounded-full border-3 border-white flex items-center justify-center text-xl font-semibold -mt-8 flex-shrink-0"
              style={{ background: bg, color: text, borderWidth: 3 }}
            >
              {getInitials(person.full_name)}
            </div>
            <div className="pb-1">
              <h1 className="text-[18px] font-semibold text-foreground">{person.full_name}</h1>
              <p className="text-[12px] text-muted-foreground">
                {person.organisation?.name ?? "Independent"} · {person.isl_ref}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="pill pill-female">{person.gender}</span>
                {person.is_youth && <span className="pill pill-youth">Youth (18-35)</span>}
                {person.is_girl && <span className="pill pill-female text-[9px]">Girl</span>}
                {person.is_repeat_beneficiary && (
                  <span className="pill bg-[#2D1B69] text-white">Repeat beneficiary</span>
                )}
                {person.total_programmes > 0 && (
                  <span className="pill bg-green-100 text-green-800">{person.total_programmes} programmes</span>
                )}
                {person.is_woman && (
                  <span className="pill bg-[#DBEAFE] text-[#1E40AF]">Women-led business</span>
                )}
                {person.first_programme && (
                  <span className={`pill ${getPillClass(person.first_programme)}`}>{person.first_programme}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pb-1 flex-shrink-0">
            <Link
              href={`/people/${person.person_id}/edit`}
              className="px-3 py-1.5 rounded-lg text-[11px] border border-border bg-white hover:bg-muted/50 transition-colors"
            >
              Edit profile
            </Link>
            <Link
              href={`/api/people/${person.person_id}/card`}
              className="px-3 py-1.5 rounded-lg text-[11px] border border-border bg-white hover:bg-muted/50 transition-colors"
            >
              Profile card
            </Link>
            <Link
              href={`/people/${person.person_id}/contact`}
              className="px-3 py-1.5 rounded-lg text-[11px] bg-[#2D1B69] text-white hover:bg-[#4A2FA0] transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
