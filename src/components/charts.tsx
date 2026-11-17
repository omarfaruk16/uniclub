import { cn } from "@/lib/utils";

/** Vertical column chart (pure CSS) for time series such as monthly registrations. */
export function ColumnChart({
  data,
  color = "bg-brand-500",
  height = 180,
  valueSuffix = "",
}: {
  data: { label: string; value: number; secondary?: number }[];
  color?: string;
  height?: number;
  valueSuffix?: string;
}) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.secondary ?? 0)));
  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-3" style={{ height }} role="img" aria-label={data.map((d) => `${d.label}: ${d.value}`).join(", ")}>
        {data.map((d) => (
          <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs font-semibold text-slate-700">{d.value}{valueSuffix}</span>
            <div className="flex w-full max-w-12 items-end justify-center gap-1" style={{ height: "100%" }}>
              <div className={cn("w-full rounded-t-md transition group-hover:opacity-80", color)} style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }} />
              {d.secondary !== undefined && (
                <div className="w-full rounded-t-md bg-gold-400 transition group-hover:opacity-80" style={{ height: `${Math.max(2, (d.secondary / max) * 100)}%` }} />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 border-t border-slate-100 pt-2 sm:gap-3">
        {data.map((d) => (
          <span key={d.label} className="flex-1 truncate text-center text-[11px] text-slate-500">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bar list for ranked categories. */
export function BarList({ data, color = "bg-brand-500", max: maxOverride }: { data: { label: string; value: number; hint?: string }[]; color?: string; max?: number }) {
  const max = maxOverride ?? Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <p className="py-6 text-center text-sm text-slate-400">No data yet</p>;
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate text-slate-700">{d.label}</span>
            <span className="shrink-0 font-semibold text-slate-900">{d.hint ?? d.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-brand-50">
            <div className={cn("h-full rounded-full", color)} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const DONUT_COLORS = ["#176B50", "#F5B942", "#4FA37E", "#1F6F8B", "#A2452F", "#8BC7A8", "#5B4B9A", "#B97A12"];

/** Donut chart via conic-gradient with a legend. */
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
      <div className="relative size-40 shrink-0 rounded-full" style={{ background: total ? `conic-gradient(${stops})` : "#f0f7f3" }} role="img" aria-label={data.map((d) => `${d.label}: ${d.value}`).join(", ")}>
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white">
          <span className="font-display text-2xl font-bold text-slate-900">{total}</span>
          {centerLabel && <span className="text-xs text-slate-500">{centerLabel}</span>}
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="flex-1 truncate text-slate-600">{d.label}</span>
            <span className="font-semibold text-slate-900">{d.value}</span>
            <span className="w-10 text-right text-xs text-slate-400">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
