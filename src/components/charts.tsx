import { cn } from "@/lib/utils";

function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s * 4 >= v) ?? pow * 10;
  return step * 4;
}

/**
 * Column chart for time series (e.g. monthly registrations).
 * Bars are soft tints; the busiest column is solid with a marker, and every column shows a tooltip on hover/focus.
 */
export function ColumnChart({
  data,
  color = "bg-brand-500",
  height = 200,
  valueSuffix = "",
  valueLabel = "Total",
}: {
  data: { label: string; value: number; secondary?: number }[];
  color?: string;
  height?: number;
  valueSuffix?: string;
  valueLabel?: string;
}) {
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const peak = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? -1) ? i : best), 0);
  const ticks = [4, 3, 2, 1, 0].map((t) => Math.round((max / 4) * t));
  return (
    <div className="flex gap-2 sm:gap-3">
      <div className="flex flex-col justify-between pb-7 text-right text-[11px] text-slate-400 tabular-nums" style={{ height: height + 28 }} aria-hidden>
        {ticks.map((t) => <span key={t} className="-translate-y-1/2 leading-none">{t}</span>)}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height }} aria-hidden>
          {ticks.map((t) => <span key={t} className="border-t border-dashed border-line" />)}
        </div>
        <div className="relative flex items-end gap-1.5 sm:gap-3" style={{ height }} role="img" aria-label={data.map((d) => `${d.label}: ${d.value}${valueSuffix}`).join(", ")}>
          {data.map((d, i) => {
            const pct = Math.max(2, (d.value / max) * 100);
            const isPeak = i === peak && d.value > 0;
            return (
              <div key={d.label} tabIndex={0} className="group relative flex h-full flex-1 items-end justify-center outline-none">
                <div
                  className={cn(
                    "relative w-full max-w-14 rounded-t-lg transition-opacity",
                    color,
                    isPeak ? "opacity-100" : "opacity-[0.16] group-hover:opacity-40 group-focus:opacity-40",
                  )}
                  style={{ height: `${pct}%` }}
                >
                  {isPeak && <span className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-none bg-gradient-to-t from-white/45 to-transparent" />}
                  {isPeak && <span className="absolute top-0 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ink shadow" />}
                </div>
                <div
                  className={cn(
                    "pointer-events-none absolute bottom-full z-10 mb-1 rounded-lg bg-ink px-2.5 py-1.5 text-[11px] whitespace-nowrap text-white shadow-lift transition",
                    "opacity-0 group-hover:opacity-100 group-focus:opacity-100",
                  )}
                  style={{ bottom: `calc(${pct}% + 10px)` }}
                >
                  <span className="block text-white/60">{d.label}</span>
                  <span className="font-semibold">{valueLabel}: {d.value}{valueSuffix}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex h-5 gap-1.5 sm:gap-3">
          {data.map((d, i) => (
            <span key={d.label} className={cn("flex-1 truncate text-center text-[11px]", i === peak ? "font-semibold text-slate-700" : "text-slate-400")}>{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Horizontal bar list for ranked categories. */
export function BarList({ data, color = "bg-brand-500", max: maxOverride }: { data: { label: string; value: number; hint?: string }[]; color?: string; max?: number }) {
  const max = maxOverride ?? Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <p className="py-6 text-center text-sm text-slate-400">No data yet</p>;
  return (
    <ul className="space-y-3.5">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1.5 flex justify-between gap-3 text-sm">
            <span className="truncate text-slate-600">{d.label}</span>
            <span className="shrink-0 font-semibold text-slate-900 tabular-nums">{d.hint ?? d.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className={cn("h-full rounded-full", color)} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const DONUT_COLORS = ["#176B50", "#F5B942", "#7FC2A0", "#111714", "#E07A5F", "#B0DBC4", "#6C63A8", "#B97A12"];

/** Donut chart (conic-gradient) with a legend. */
export function Donut({ data, centerLabel }: { data: { label: string; value: number }[]; centerLabel?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  const stops = data
    .map((d, i) => {
      const from = (acc / Math.max(total, 1)) * 360;
      acc += d.value;
      const to = (acc / Math.max(total, 1)) * 360;
      return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${from}deg ${to}deg`;
    })
    .join(", ");
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative size-36 shrink-0 rounded-full sm:size-40" style={{ background: total ? `conic-gradient(${stops})` : "#eef0f3" }} role="img" aria-label={data.map((d) => `${d.label}: ${d.value}`).join(", ")}>
        <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-white">
          <span className="font-display text-2xl font-bold text-slate-900">{total}</span>
          {centerLabel && <span className="text-xs text-slate-500">{centerLabel}</span>}
        </div>
      </div>
      <ul className="w-full space-y-2.5 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-[4px]" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="flex-1 truncate text-slate-600">{d.label}</span>
            <span className="font-semibold text-slate-900 tabular-nums">{d.value}</span>
            <span className="w-10 text-right text-xs text-slate-400 tabular-nums">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
