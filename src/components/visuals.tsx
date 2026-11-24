import {
  Briefcase, Camera, Code2, Cpu, Dumbbell, FlaskConical, GraduationCap, HeartHandshake,
  Mic, Music, Presentation, Trophy, Users, Wrench, Megaphone, CalendarDays,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";

const PALETTE: [string, string][] = [
  ["#176B50", "#0B3328"],
  ["#258660", "#0F4534"],
  ["#1F6F8B", "#0E3B4D"],
  ["#B97A12", "#7A4E0C"],
  ["#5B4B9A", "#2E2556"],
  ["#A2452F", "#5E2117"],
  ["#2E7D6B", "#123F36"],
  ["#3E6B2F", "#1F3A16"],
];

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export const paletteFor = (seed: string) => PALETTE[hash(seed) % PALETTE.length]!;

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Technology: Cpu,
  Cultural: Music,
  Sports: Dumbbell,
  Academic: GraduationCap,
  "Arts & Media": Camera,
  "Social Service": HeartHandshake,
  Social: HeartHandshake,
  Business: Briefcase,
  Science: FlaskConical,
  Workshop: Wrench,
  Seminar: Presentation,
  Competition: Trophy,
  Hackathon: Code2,
  Meetup: Users,
  Debate: Mic,
};

export const categoryIcon = (c: string) => ICONS[c] ?? CalendarDays;

export function Avatar({ name, src, size = 40, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  const [a, b] = paletteFor(name);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size} className={cn("shrink-0 rounded-full object-cover ring-2 ring-white", className)} style={{ width: size, height: size }} />
  ) : (
    <span
      aria-label={name}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white", className)}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38), background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      {initials(name) || "?"}
    </span>
  );
}

export function ClubLogo({ name, src, category, size = 56, className }: { name: string; src?: string | null; category?: string; size?: number; className?: string }) {
  const [a, b] = paletteFor(name);
  const Icon = category ? categoryIcon(category) : null;
  const radius = Math.round(size * 0.28);
  if (src)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={`${name} logo`} className={cn("shrink-0 bg-white object-cover ring-1 ring-slate-100", className)} style={{ width: size, height: size, borderRadius: radius }} />
    );
  return (
    <span
      aria-label={`${name} logo`}
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden font-display font-bold text-white", className)}
      style={{ width: size, height: size, borderRadius: radius, background: `linear-gradient(140deg, ${a}, ${b})`, fontSize: size * 0.34 }}
    >
      {Icon && <Icon className="absolute -right-1 -bottom-1 opacity-20" />}
      <span className="relative">{initials(name)}</span>
      <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-gold-400" style={{ width: size * 0.1, height: size * 0.1 }} />
    </span>
  );
}

/** Cover/banner image with a generated branded fallback when no image was uploaded. */
export function Cover({
  src,
  seed,
  category,
  className,
  children,
  iconSize = "size-16",
}: {
  src?: string | null;
  seed: string;
  category?: string;
  className?: string;
  children?: React.ReactNode;
  iconSize?: string;
}) {
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
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="relative flex size-9 items-center justify-center rounded-[11px] bg-brand-600">
        <svg viewBox="0 0 32 32" className="size-[22px]" aria-hidden>
          <path d="M9 7v9.5a7 7 0 0 0 14 0V7" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
          <circle cx="23" cy="25.5" r="3" fill="#F5B942" />
        </svg>
      </span>
      {!compact && (
        <span className={cn("font-display text-[1.3rem] font-bold tracking-tight", light ? "text-white" : "text-ink")}>
          {name}
        </span>
      )}
    </span>
  );
}

export { Megaphone };
