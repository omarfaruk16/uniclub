"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";

type Option = { value: string; label: string };
type Select = { name: string; label: string; options: Option[] };

/** Search bar + filter dropdowns that update the URL query (server components re-render). */
export function Filters({ placeholder = "Search…", selects = [], tabs }: { placeholder?: string; selects?: Select[]; tabs?: { name: string; options: Option[] } }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [pending, start] = useTransition();

  const update = (changes: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) (v ? sp.set(k, v) : sp.delete(k));
    sp.delete("page");
    const qs = sp.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  // Debounced live search.
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => update({ q }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mb-5 space-y-3">
      {tabs && (
        <div className="flex gap-1 overflow-x-auto scrollbar-none rounded-xl border border-line bg-white p-1 sm:inline-flex">
          {tabs.options.map((o) => {
            const active = (params.get(tabs.name) ?? tabs.options[0]!.value) === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => update({ [tabs.name]: o.value === tabs.options[0]!.value ? "" : o.value })}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium whitespace-nowrap transition ${active ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && update({ q })}
            placeholder={placeholder}
            aria-label="Search"
            className="input pr-10 pl-10"
          />
          {pending ? (
            <Loader2 className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-brand-500" />
          ) : q ? (
            <button type="button" onClick={() => { setQ(""); update({ q: "" }); }} className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Clear search">
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        {selects.map((s) => (
          <select
            key={s.name}
            aria-label={s.label}
            value={params.get(s.name) ?? ""}
            onChange={(e) => update({ [s.name]: e.target.value })}
            className="input sm:w-52"
          >
            <option value="">{s.label}</option>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>
  );
}

