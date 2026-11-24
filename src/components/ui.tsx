import Link from "next/link";
import { ArrowRight, ArrowUpRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldError } from "./action-form";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-[1.375rem] font-bold sm:text-2xl">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeading({
  title,
  eyebrow,
  description,
  href,
  linkLabel = "View all",
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-sm font-semibold text-brand-600">{eyebrow}</p>}
        <h2 className="text-2xl font-bold sm:text-[1.75rem]">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
          {linkLabel} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

const TONES = {
  brand: "bg-brand-50 text-brand-700",
  gold: "bg-gold-50 text-gold-700",
  blue: "bg-sky-50 text-sky-700",
  rose: "bg-rose-50 text-rose-600",
  violet: "bg-violet-50 text-violet-700",
  slate: "bg-slate-100 text-slate-600",
} as const;

/** Compact metric tile used on section pages. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof TONES;
  hint?: React.ReactNode;
}) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", TONES[tone])}>
          <Icon className="size-[18px]" />
        </span>
        <p className="min-w-0 truncate text-sm font-medium text-slate-600">{label}</p>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">{value}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/**
 * Large overview card (title, subtitle, big number, footer link).
 * `featured` renders the green highlight version used for the most important metric.
 */
export function MetricCard({
  title,
  subtitle,
  value,
  icon: Icon,
  chip,
  href,
  linkLabel = "See details",
  featured = false,
  className,
}: {
  title: string;
  subtitle?: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  chip?: React.ReactNode;
  href?: string;
  linkLabel?: string;
  featured?: boolean;
  className?: string;
}) {
  const body = (
    <>
      <div className="relative flex items-start gap-3 p-4 sm:p-5">
        <span
          className={cn(
            "size-11 shrink-0 items-center justify-center rounded-xl",
            featured ? "flex bg-white text-brand-700 shadow-sm" : "hidden border border-line bg-slate-50 text-slate-700 sm:flex",
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className={cn("truncate font-semibold", featured ? "text-white" : "text-slate-900")}>{title}</p>
          {subtitle && <p className={cn("truncate text-xs", featured ? "text-brand-100" : "hidden text-slate-500 sm:block")}>{subtitle}</p>}
        </div>
      </div>
      <div className="relative flex flex-wrap items-center gap-2 px-4 pb-4 sm:px-5 sm:pb-5">
        <p className={cn("font-display leading-none font-bold tracking-tight", featured ? "text-[2rem] text-white" : "text-[1.6rem] text-slate-900 sm:text-[2rem]")}>{value}</p>
        {chip && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              featured ? "bg-white/15 text-white ring-1 ring-white/30" : "bg-brand-50 text-brand-700",
            )}
          >
            {chip}
          </span>
        )}
      </div>
      {href && (
        <div
          className={cn(
            "relative mt-auto flex items-center justify-between border-t px-4 py-3 text-sm font-medium sm:px-5",
            featured ? "border-white/15 text-white" : "border-line text-slate-600 group-hover:text-slate-900",
          )}
        >
          <span className="truncate">{linkLabel}</span>
          <ArrowRight className="size-4 shrink-0 transition group-hover:translate-x-0.5" />
        </div>
      )}
    </>
  );
  const cls = cn(
    "group relative flex flex-col overflow-hidden rounded-2xl",
    featured ? "bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-white" : "border border-line bg-white",
    href && !featured && "transition hover:border-slate-300",
    featured && "col-span-2 md:col-span-1",
    className,
  );
  const deco = featured ? <span aria-hidden className="pattern-grid pointer-events-none absolute inset-0 [mask-image:linear-gradient(110deg,transparent_30%,black)]" /> : null;
  return href ? (
    <Link href={href} className={cls}>{deco}{body}</Link>
  ) : (
    <div className={cls}>{deco}{body}</div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-white px-6 py-12 text-center", className)}>
      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-line bg-slate-50 text-slate-500">
        <Icon className="size-5" />
      </div>
      <p className="font-display font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const BADGE: Record<string, string> = {
  green: "bg-brand-50 text-brand-700",
  gold: "bg-gold-50 text-gold-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
};
const DOT: Record<string, string> = {
  green: "bg-brand-500",
  gold: "bg-gold-500",
  red: "bg-red-500",
  slate: "bg-slate-400",
  blue: "bg-sky-500",
  violet: "bg-violet-500",
};

const STATUS_TONE: Record<string, [string, string]> = {
  APPROVED: ["green", "Approved"],
  ACTIVE: ["green", "Active"],
  PUBLISHED: ["green", "Published"],
  REGISTERED: ["green", "Registered"],
  ATTENDED: ["green", "Attended"],
  UPCOMING: ["blue", "Upcoming"],
  ONGOING: ["gold", "Happening now"],
  COMPLETED: ["slate", "Completed"],
  PENDING: ["gold", "Pending"],
  DRAFT: ["slate", "Draft"],
  REJECTED: ["red", "Rejected"],
  SUSPENDED: ["red", "Suspended"],
  CANCELLED: ["red", "Cancelled"],
  ABSENT: ["red", "Absent"],
  STUDENT: ["blue", "Student"],
  REP: ["violet", "Club Rep"],
  ADMIN: ["gold", "Admin"],
};

export function Badge({ children, tone = "slate", className, dot = false }: { children: React.ReactNode; tone?: keyof typeof BADGE | string; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", BADGE[tone] ?? BADGE.slate, className)}>
      {dot && <span className={cn("size-1.5 rounded-full", DOT[tone] ?? DOT.slate)} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const [tone, text] = STATUS_TONE[status] ?? ["slate", status];
  return <Badge tone={tone} dot>{label ?? text}</Badge>;
}

export function Field({
  label,
  name,
  hint,
  children,
  className,
  required,
}: {
  label: string;
  name: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="label">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && <p className="hint">{hint}</p>}
      <FieldError name={name} />
    </div>
  );
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("card", className)}>
      {title && (
        <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold sm:text-[17px]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Small pill link used in card headers ("View all ↗"). */
export function CardLink({ href, children = "View all" }: { href: string; children?: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
      {children} <ArrowUpRight className="size-3.5" />
    </Link>
  );
}
