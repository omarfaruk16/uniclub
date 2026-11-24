"use client";

import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { categoryIcon, paletteFor } from "@/lib/palette";

/** Admin-managed graphics that client and server components both render. */
type Media = { logo: string; defaultClubCover: string; defaultEventBanner: string };
const MediaContext = createContext<Media>({ logo: "", defaultClubCover: "", defaultEventBanner: "" });

export function MediaProvider({ value, children }: { value: Media; children: React.ReactNode }) {
  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

export const useMedia = () => useContext(MediaContext);

/** Cover/banner image with a generated branded fallback when no image was uploaded. */
export function Cover({
  src: own,
  seed,
  category,
  kind = "event",
  className,
  children,
  iconSize = "size-16",
}: {
  src?: string | null;
  seed: string;
  category?: string;
  /** Which admin-set default image to fall back to. */
  kind?: "club" | "event";
  className?: string;
  children?: React.ReactNode;
  iconSize?: string;
}) {
  const media = useMedia();
  const src = own || (kind === "club" ? media.defaultClubCover : media.defaultEventBanner) || null;
  const [a, b] = paletteFor(seed);
  const Icon = categoryIcon(category ?? "");
  return (
    <div className={cn("relative overflow-hidden", className)} style={src ? undefined : { background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)` }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <>
          <div className="pattern-grid absolute inset-0" />
          <svg aria-hidden viewBox="0 0 200 200" className="absolute -right-10 -bottom-16 size-56 text-white/15">
            <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="100" cy="100" r="66" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="100" cy="100" r="36" fill="currentColor" />
          </svg>
          <span className="absolute top-4 left-4 h-1.5 w-10 rounded-full bg-gold-400/80" />
          <Icon className={cn("absolute right-6 bottom-5 text-white/40", iconSize)} />
        </>
      )}
      {children}
    </div>
  );
}

export function Logo({ name = "UniQue", light = false, compact = false }: { name?: string; light?: boolean; compact?: boolean }) {
  const { logo } = useMedia();
  return (
    <span className="inline-flex items-center gap-2.5">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="size-9 shrink-0 rounded-[11px] object-contain" />
      ) : (
      <span className="relative flex size-9 items-center justify-center rounded-[11px] bg-brand-600">
        <svg viewBox="0 0 32 32" className="size-[22px]" aria-hidden>
          <path d="M9 7v9.5a7 7 0 0 0 14 0V7" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
          <circle cx="23" cy="25.5" r="3" fill="#F5B942" />
        </svg>
      </span>
      )}
      {!compact && (
        <span className={cn("font-display text-[1.3rem] font-bold tracking-tight", light ? "text-white" : "text-ink")}>
          {name}
        </span>
      )}
    </span>
  );
}

