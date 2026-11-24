import { cn, initials } from "@/lib/utils";
import { categoryIcon, paletteFor } from "@/lib/palette";

export { categoryIcon, paletteFor } from "@/lib/palette";
export { Cover, Logo } from "./brand";

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

export { Megaphone } from "lucide-react";
