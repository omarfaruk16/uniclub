import { BadgeCheck, CalendarDays, Users } from "lucide-react";
import { db } from "@/lib/db";
import { PUBLIC_EVENT } from "@/lib/queries";
import { formatDay, formatMonth, formatTime, formatWeekday } from "@/lib/utils";
import { Avatar, ClubLogo } from "./visuals";

/** Live data for the floating cards that sit on top of the campus scene. */
export async function sceneData() {
  const now = new Date();
  const [next, club, people, events] = await Promise.all([
    db.event.findFirst({
      where: { ...PUBLIC_EVENT, startAt: { gte: now } },
      orderBy: { startAt: "asc" },
      include: { club: { select: { name: true } }, _count: { select: { registrations: { where: { status: "REGISTERED" } } } } },
    }),
    db.club.findFirst({
      where: { status: "APPROVED" },
      orderBy: { memberships: { _count: "desc" } },
      include: { _count: { select: { memberships: { where: { status: "APPROVED" } } } } },
    }),
    db.user.findMany({ where: { role: { in: ["STUDENT", "REP"] }, status: "ACTIVE" }, select: { id: true, name: true, avatar: true }, take: 4, orderBy: { createdAt: "asc" } }),
    db.event.count({ where: { ...PUBLIC_EVENT, startAt: { gte: now } } }),
  ]);
  return { next, club, people, events };
}

type Data = Awaited<ReturnType<typeof sceneData>>;

export function NextEventCard({ data, className }: { data: Data; className?: string }) {
  if (!data.next) return null;
  const e = data.next;
  return (
    <div className={`w-64 rounded-2xl bg-white/95 p-3.5 shadow-float ring-1 ring-black/5 backdrop-blur ${className ?? ""}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><CalendarDays className="size-3.5 text-brand-600" /> Next on campus</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-600 leading-none text-white">
          <span className="text-[9px] font-semibold uppercase opacity-80">{formatMonth(e.startAt)}</span>
          <span className="mt-0.5 text-base font-bold">{formatDay(e.startAt)}</span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{e.title}</p>
          <p className="truncate text-xs text-slate-500">{formatWeekday(e.startAt)}, {formatTime(e.startAt)} · {e.club.name}</p>
        </div>
      </div>
    </div>
  );
}

export function RegisteredCard({ data, className }: { data: Data; className?: string }) {
  return (
    <div className={`flex w-60 items-center gap-3 rounded-2xl bg-white/95 p-3 shadow-float ring-1 ring-black/5 backdrop-blur ${className ?? ""}`}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"><BadgeCheck className="size-5" /></span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">Registration confirmed</p>
        <p className="truncate text-xs text-slate-500">{data.next ? `${data.next._count.registrations} students going` : `${data.events} events open`}</p>
      </div>
    </div>
  );
}

export function ClubCardMini({ data, className }: { data: Data; className?: string }) {
  if (!data.club) return null;
  return (
    <div className={`w-64 rounded-2xl bg-ink/90 p-3.5 text-white shadow-float backdrop-blur ${className ?? ""}`}>
      <div className="flex items-center gap-3">
        <ClubLogo name={data.club.name} src={data.club.logo} category={data.club.category} size={36} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{data.club.name}</p>
          <p className="flex items-center gap-1 text-xs text-white/60"><Users className="size-3" /> {data.club._count.memberships} members</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex -space-x-2">
          {data.people.map((p) => <Avatar key={p.id} name={p.name} src={p.avatar} size={26} className="ring-2 ring-ink" />)}
        </div>
        <span className="rounded-full bg-gold-400 px-2.5 py-1 text-[11px] font-bold text-ink">Join club</span>
      </div>
    </div>
  );
}
