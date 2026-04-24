"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props { current: Record<string, any> }

export function PeopleFiltersBar({ current }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  function isActive(key: string) {
    return current[key] === true || current[key] === "true";
  }

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="isl-card flex items-center gap-3 px-4 py-2.5 flex-wrap">
      {/* Search */}
      <input
        defaultValue={current.search ?? ""}
        placeholder="Search name, email, phone…"
        onKeyDown={(e) => {
          if (e.key === "Enter") setParam("search", (e.target as HTMLInputElement).value || null);
        }}
        className="flex-1 min-w-[180px] px-3 py-1.5 text-[11px] border border-border rounded-lg
                   focus:outline-none focus:ring-1 focus:ring-[#2D1B69]/40 bg-white"
      />

      {/* Gender */}
      <select
        value={current.gender ?? ""}
        onChange={(e) => setParam("gender", e.target.value || null)}
        className="px-2.5 py-1.5 text-[11px] border border-border rounded-lg bg-white focus:outline-none"
      >
        <option value="">All genders</option>
        <option value="Female">Female</option>
        <option value="Male">Male</option>
        <option value="Unknown">Unknown</option>
      </select>

      {/* Age group */}
      <select
        value={current.age_group ?? ""}
        onChange={(e) => setParam("age_group", e.target.value || null)}
        className="px-2.5 py-1.5 text-[11px] border border-border rounded-lg bg-white focus:outline-none"
      >
        <option value="">All ages</option>
        <option value="Girl">Girl (under 18)</option>
        <option value="Youth">Youth (18–35)</option>
        <option value="Adult">Adult (36–59)</option>
        <option value="Aged">Aged (60+)</option>
      </select>

      {/* District */}
      <select
        value={current.district ?? ""}
        onChange={(e) => setParam("district", e.target.value || null)}
        className="px-2.5 py-1.5 text-[11px] border border-border rounded-lg bg-white focus:outline-none"
      >
        <option value="">All districts</option>
        <option value="Freetown">Freetown</option>
        <option value="Bo">Bo</option>
        <option value="Makeni">Makeni</option>
        <option value="Kono">Kono</option>
        <option value="Kenema">Kenema</option>
      </select>

      {/* Quick toggles */}
      {[
        { key: "is_woman", label: "Women only" },
        { key: "is_youth", label: "Youth only"  },
        { key: "is_repeat",label: "Repeat beneficiaries" },
      ].map((t) => (
        <button
          key={t.key}
          onClick={() => setParam(t.key, isActive(t.key) ? null : "true")}
          className={cn(
            "px-2.5 py-1.5 rounded-lg text-[10px] border font-medium transition-colors",
            isActive(t.key)
              ? "bg-[#2D1B69] text-white border-[#2D1B69]"
              : "bg-white text-muted-foreground border-border hover:bg-[#EDE8F8]"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
