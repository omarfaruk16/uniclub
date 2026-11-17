import { TIME_ZONE, TZ_OFFSET } from "./constants";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9]/.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, ...opts });

const dateFmt = fmt({ day: "numeric", month: "short", year: "numeric" });
const shortDateFmt = fmt({ day: "numeric", month: "short" });
const timeFmt = fmt({ hour: "numeric", minute: "2-digit", hour12: true });
const weekdayFmt = fmt({ weekday: "short" });
const dayFmt = fmt({ day: "2-digit" });
const monthFmt = fmt({ month: "short" });
const monthYearFmt = fmt({ month: "short", year: "2-digit" });

export const formatDate = (d: Date) => dateFmt.format(d);
export const formatShortDate = (d: Date) => shortDateFmt.format(d);
export const formatTime = (d: Date) => timeFmt.format(d).toLowerCase();
export const formatDateTime = (d: Date) => `${formatDate(d)}, ${formatTime(d)}`;
export const formatWeekday = (d: Date) => weekdayFmt.format(d);
export const formatDay = (d: Date) => dayFmt.format(d);
export const formatMonth = (d: Date) => monthFmt.format(d);
export const formatMonthYear = (d: Date) => monthYearFmt.format(d);

export function timeAgo(d: Date) {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return formatDate(d);
}

/** Parts of a Date in the university time zone, for <input type="date|time"> values. */
export function toInputParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${hour}:${get("minute")}` };
}

/** Build a Date from local (university time zone) date + time strings. */
export function fromInputParts(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const d = new Date(`${date}T${time}:00${TZ_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Year-month key in the university time zone, e.g. "2026-03". */
export function monthKey(d: Date) {
  return toInputParts(d).date.slice(0, 7);
}

/** The last `n` month keys ending with the current month. */
export function lastMonths(n: number) {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 15));
    out.push({ key: monthKey(d), label: formatMonthYear(d) });
  }
  return out;
}

export function pluralize(n: number, word: string, plural = `${word}s`) {
  return `${n} ${n === 1 ? word : plural}`;
}

export function getString(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function pageParam(v: string | string[] | undefined) {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function strParam(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export function eventPhase(e: { startAt: Date; endAt: Date; status: string }) {
  if (e.status === "CANCELLED") return "CANCELLED";
  if (e.status === "DRAFT") return "DRAFT";
  const now = Date.now();
  if (e.endAt.getTime() < now) return "COMPLETED";
  if (e.startAt.getTime() <= now) return "ONGOING";
  return "UPCOMING";
}

export const toOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));
