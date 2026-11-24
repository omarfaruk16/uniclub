import { CalendarDays } from "lucide-react";
import { formatDate } from "@/lib/utils";

/** Page intro used by the three overview dashboards: title + summary on the left, actions on the right. */
export function OverviewHeader({ title, text, children }: { title: string; text: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[1.375rem] font-bold sm:text-2xl">{title}</h1>
        <p className="mt-0.5 text-sm text-slate-500">{text}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-sm font-medium text-slate-700">
          <CalendarDays className="size-4 text-slate-500" /> {formatDate(new Date())}
        </span>
        {children}
      </div>
    </div>
  );
}

/** Big headline number for chart cards. */
export function ChartTotal({ label, value, note }: { label: string; value: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-2">
        <p className="font-display text-[1.75rem] leading-none font-bold tracking-tight text-slate-900 sm:text-3xl">{value}</p>
        {note && <span className="text-xs font-medium text-slate-500">{note}</span>}
      </div>
    </div>
  );
}

/** Date tile (month over day) used in event lists. */
export function DateTile({ month, day }: { month: string; day: string }) {
  return (
    <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-white leading-none">
      <span className="text-[10px] font-semibold text-brand-600 uppercase">{month}</span>
      <span className="mt-0.5 font-display text-lg font-bold text-slate-900">{day}</span>
    </span>
  );
}
