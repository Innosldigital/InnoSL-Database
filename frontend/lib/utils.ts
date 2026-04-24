import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { EventType, GenderType } from "@/types";

// ── Tailwind class merger ────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Date helpers ─────────────────────────────────────────────
export function fmtDate(date?: string | null): string {
  if (!date) return "—";
  try { return format(parseISO(date), "d MMM yyyy"); }
  catch { return date; }
}

export function fmtDateShort(date?: string | null): string {
  if (!date) return "—";
  try { return format(parseISO(date), "MMM yyyy"); }
  catch { return date; }
}

export function fmtRelative(date?: string | null): string {
  if (!date) return "—";
  try { return formatDistanceToNow(parseISO(date), { addSuffix: true }); }
  catch { return date; }
}

// ── Number helpers ───────────────────────────────────────────
export function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-SL").format(n);
}

export function fmtUSD(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function fmtPct(n: number | null | undefined, decimals = 1): string {
  if (n == null) return "—";
  return `${n.toFixed(decimals)}%`;
}

// ── ISL Reference generator ──────────────────────────────────
export function genPersonRef(seq: number): string {
  return `ISL-P-${String(seq).padStart(5, "0")}`;
}
export function genEventRef(type: EventType, year: number, seq: number): string {
  return `ISL-E-${type}-${year}-${String(seq).padStart(3, "0")}`;
}

// ── Initials from full name ──────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ── Avatar colour from name ──────────────────────────────────
const AVATAR_COLOURS = [
  { bg: "#EDE8F8", text: "#4A2FA0" },
  { bg: "#E1F5EE", text: "#0F6E56" },
  { bg: "#FCE7F3", text: "#9D174D" },
  { bg: "#DBEAFE", text: "#1E40AF" },
  { bg: "#D1FAE5", text: "#065F46" },
  { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#FEE2E2", text: "#991B1B" },
  { bg: "#F0FDF4", text: "#15803D" },
];

export function getAvatarColour(name: string): { bg: string; text: string } {
  const idx = name.charCodeAt(0) % AVATAR_COLOURS.length;
  return AVATAR_COLOURS[idx];
}

// ── Programme pill colour ────────────────────────────────────
export function getPillClass(programme: EventType | string): string {
  const map: Record<string, string> = {
    FPN:        "pill-fpn",
    FIW:        "pill-fiw",
    GEW:        "pill-gew",
    OSVP:       "pill-osvp",
    Dare2Aspire:"pill-d2a",
    EWC:        "pill-gew",
    SLEDP:      "pill-sledp",
    NYEFF:      "pill-fpn",
  };
  return map[programme] ?? "pill-gew";
}

// ── Completeness score colour ────────────────────────────────
export function getScoreColour(score: number): string {
  if (score >= 80) return "text-green-700";
  if (score >= 60) return "text-amber-700";
  return "text-red-700";
}

// ── Gender badge colour ──────────────────────────────────────
export function getGenderPill(gender: GenderType): string {
  if (gender === "Female") return "pill-female";
  if (gender === "Male")   return "pill-male";
  return "bg-slate-100 text-slate-600";
}

// ── Dedup: fuzzy phone normalise ─────────────────────────────
export function normalisePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("232")) digits = digits.slice(3);
  if (digits.startsWith("0"))   digits = digits.slice(1);
  return digits.length >= 8 ? `+232${digits.slice(-8)}` : raw;
}

// ── Dedup: normalise name for comparison ─────────────────────
export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Title-case a string ──────────────────────────────────────
export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

// ── Auto-detect gender from Sierra Leonean name bank ─────────
const FEMALE_NAMES = new Set([
  "fatmata","mariama","aminata","hawa","isatu","kadiatu","fanta","zainab",
  "ramatu","bintu","adama","sia","jeneba","musu","kumba","umu","sallay",
  "francess","patricia","agnes","mary","victoria","christiana","josephine",
  "marian","georgette","sylvia","ernestina","esther","rosaline","edwarda",
  "latifatu","rashidatu","saffiatu","hassanatu","alliyah","toluwani","binta",
  "tairatu","rahenatu","kadiatu","nancy","ajara","eunice","andra","gifty",
]);

export function inferGender(name: string): GenderType | null {
  const first = name.split(" ")[0]?.toLowerCase();
  if (!first) return null;
  if (FEMALE_NAMES.has(first)) return "Female";
  return null; // don't guess Male — flag for review
}
