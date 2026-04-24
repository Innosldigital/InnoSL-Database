import Link from "next/link";

interface Props { href: string; label: string; ref?: string }

export function BackButton({ href, label, ref }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Link href={href} className="text-[11px] text-[#1E40AF] hover:underline flex items-center gap-1">
        ← {label}
      </Link>
      {ref && <span className="text-muted-foreground text-[11px]">· {ref}</span>}
    </div>
  );
}
