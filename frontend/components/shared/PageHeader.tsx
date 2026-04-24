import Link from "next/link";
import { cn } from "@/lib/utils";

interface Action {
  label:    string;
  href?:    string;
  onClick?: () => void;
  variant:  "primary" | "secondary";
}

interface Props {
  title:    string;
  subtitle?: string;
  actions?: Action[];
}

export function PageHeader({ title, subtitle, actions = [] }: Props) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-[17px] font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 md:flex-shrink-0">
          {actions.map((a) =>
            a.href ? (
              <Link
                key={a.label}
                href={a.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors",
                  a.variant === "primary"
                    ? "bg-[#2D1B69] text-white hover:bg-[#4A2FA0]"
                    : "bg-white text-foreground border border-border hover:bg-muted/50"
                )}
              >
                {a.label}
              </Link>
            ) : a.onClick ? (
              <button
                key={a.label}
                onClick={a.onClick}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors",
                  a.variant === "primary"
                    ? "bg-[#2D1B69] text-white hover:bg-[#4A2FA0]"
                    : "bg-white text-foreground border border-border hover:bg-muted/50"
                )}
              >
                {a.label}
              </button>
            ) : (
              <span
                key={a.label}
                aria-disabled="true"
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-medium border cursor-not-allowed opacity-60",
                  a.variant === "primary"
                    ? "bg-[#2D1B69] text-white border-[#2D1B69]"
                    : "bg-white text-foreground border-border"
                )}
              >
                {a.label}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}
