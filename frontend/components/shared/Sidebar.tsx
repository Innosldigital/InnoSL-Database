"use client";
import Link           from "next/link";
import { usePathname } from "next/navigation";
import { cn }         from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  dot: string;
  badge: string | null;
  badgeColor?: string;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    section: "Overview",
    items: [
      { label: "Analytics dashboard", href: "/dashboard", dot: "#38BDF8", badge: null },
      { label: "People",              href: "/people",    dot: "#38BDF8", badge: "1,240+" },
    ],
  },
  {
    section: "Programmes",
    items: [
      { label: "Events & attendance",       href: "/events",     dot: "#F59E0B", badge: null },
      { label: "Pitch competitions",         href: "/pitches",    dot: "#EF4444", badge: null },
      { label: "Training & workshops",       href: "/training",   dot: "#8B5CF6", badge: null },
      { label: "Incubation & acceleration",  href: "/cohorts",    dot: "#EC4899", badge: null },
    ],
  },
  {
    section: "Capital",
    items: [
      { label: "Grants & capital",  href: "/grants",      dot: "#22C55E", badge: null },
      { label: "Diagnostics",       href: "/diagnostics", dot: "#F97316", badge: null },
    ],
  },
  {
    section: "Ecosystem",
    items: [
      { label: "ESO partners",   href: "/esos",    dot: "#64748B", badge: null },
      { label: "VIP contacts",   href: "/vips",    dot: "#E11D48", badge: null },
    ],
  },
  {
    section: "Tools",
    items: [
      { label: "Data health",            href: "/import",  dot: "#F59E0B", badge: "12" },
      { label: "Impact reports",         href: "/reports", dot: "#38BDF8", badge: null },
      { label: "Data import",            href: "/import",  dot: "#94A3B8", badge: null },
      { label: "Settings",               href: "/settings",dot: "#94A3B8", badge: null },
    ],
  },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside className="isl-sidebar">
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto pt-2">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-4 pt-3 pb-1 text-[9px] font-medium text-[#BAE6FD] uppercase tracking-widest">
              {group.section}
            </p>
            {group.items.map((item) => {
              const active = path.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-[11px] border-l-2 transition-all",
                    active
                      ? "bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]"
                      : "text-white/60 border-transparent hover:bg-white/7 hover:text-white"
                  )}
                >
                  <span
                    className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                    style={{ background: item.dot }}
                  />
                  <span className="flex-1 leading-none">{item.label}</span>
                  {item.badge && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: item.badgeColor ? `${item.badgeColor}30` : "rgba(56,189,248,0.2)",
                        color:      item.badgeColor ?? "#38BDF8",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
