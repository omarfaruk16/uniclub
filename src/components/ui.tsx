import Link from "next/link";
import { Inbox } from "lucide-react";
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
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.7rem]">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
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
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-gold-600 uppercase">{eyebrow}</p>}
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-700">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

const TONES = {
  brand: "bg-brand-50 text-brand-600",
  gold: "bg-gold-50 text-gold-600",
  blue: "bg-sky-50 text-sky-600",
  rose: "bg-rose-50 text-rose-600",
  violet: "bg-violet-50 text-violet-600",
  slate: "bg-slate-100 text-slate-600",
} as const;

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
    <div className="card flex items-start gap-4 p-5">
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", TONES[tone])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-bold text-slate-900">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
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
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center", className)}>
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <Icon className="size-6" />
      </div>
      <p className="font-display font-semibold text-slate-800">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const BADGE: Record<string, string> = {
  // generic tones
  green: "bg-brand-50 text-brand-700 ring-brand-200",
  gold: "bg-gold-50 text-gold-700 ring-gold-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  slate: "bg-slate-50 text-slate-600 ring-slate-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
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

export function Badge({ children, tone = "slate", className }: { children: React.ReactNode; tone?: keyof typeof BADGE | string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset", BADGE[tone] ?? BADGE.slate, className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const [tone, text] = STATUS_TONE[status] ?? ["slate", status];
  return <Badge tone={tone}>{label ?? text}</Badge>;
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

export function Card({ title, actions, children, className, bodyClassName }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn("card", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          {actions}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
