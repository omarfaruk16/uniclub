import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CalendarCheck, CalendarDays, MapPin, Trophy, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ACTIVE_REGS, PUBLIC_EVENT } from "@/lib/queries";
import { AnnouncementCard } from "@/components/cards";
import { Card, EmptyState, StatCard, StatusBadge } from "@/components/ui";
import { ClubLogo } from "@/components/visuals";
import { formatDay, formatMonth, formatTime, formatWeekday } from "@/lib/utils";

export const metadata: Metadata = { title: "Student Dashboard" };

export default async function StudentDashboard() {
  const user = await requireUser();
  const now = new Date();
  const [memberships, upcomingRegs, attended, unread, clubIds] = await Promise.all([
    db.membership.findMany({
      where: { userId: user.id, status: { in: ["APPROVED", "PENDING"] } },
      include: { club: { select: { name: true, slug: true, logo: true, category: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.registration.findMany({
      where: { userId: user.id, status: "REGISTERED", event: { endAt: { gte: now }, status: "PUBLISHED" } },
      include: { event: { include: { club: { select: { name: true } } } } },
      orderBy: { event: { startAt: "asc" } },
    }),
    db.registration.count({ where: { userId: user.id, attendance: "ATTENDED" } }),
    db.notification.count({ where: { userId: user.id, read: false } }),
    db.membership.findMany({ where: { userId: user.id, status: "APPROVED" }, select: { clubId: true } }),
  ]);
  const joined = clubIds.map((m) => m.clubId);
  const registeredIds = upcomingRegs.map((r) => r.eventId);
  const [suggested, announcements] = await Promise.all([
    db.event.findMany({
      where: { ...PUBLIC_EVENT, startAt: { gte: now }, registrationDeadline: { gte: now }, id: { notIn: registeredIds }, ...(joined.length ? { clubId: { in: joined } } : {}) },
      orderBy: { startAt: "asc" },
      take: 4,
      include: { club: { select: { name: true } }, _count: { select: ACTIVE_REGS } },
    }),
    db.announcement.findMany({
      where: { OR: [{ clubId: null }, { clubId: { in: joined } }] },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 3,
      include: { club: { select: { name: true, slug: true } } },
    }),
  ]);
  const approved = memberships.filter((m) => m.status === "APPROVED");
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", hour: "numeric", hour12: false }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-brand-700 p-6 sm:p-8">
        <div className="pattern-dots absolute inset-0" />
        <div className="absolute -right-10 -bottom-20 size-60 rounded-full bg-gold-400/20 blur-2xl" />
        <div className="relative">
          <p className="text-sm text-brand-200">{greeting},</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{Date.now() - user.createdAt.getTime() < 864e5 ? "Welcome" : "Welcome back"}, {user.name.split(" ")[0]}! 👋</h1>
          <p className="mt-2 max-w-xl text-brand-100">
            {upcomingRegs.length
              ? `You have ${upcomingRegs.length} upcoming ${upcomingRegs.length === 1 ? "event" : "events"}. Here's what's next on your campus calendar.`
              : "You have no upcoming events yet. Find something interesting to join!"}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/events" className="btn btn-gold">Browse events</Link>
            <Link href="/clubs" className="btn bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/15">Explore clubs</Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clubs joined" value={approved.length} icon={Users} hint={`${memberships.length - approved.length} pending`} />
        <StatCard label="Upcoming events" value={upcomingRegs.length} icon={CalendarCheck} tone="blue" />
        <StatCard label="Events attended" value={attended} icon={Trophy} tone="gold" />
        <StatCard label="Unread notifications" value={unread} icon={Bell} tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card title="My upcoming events" actions={<Link href="/student/registrations" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>} bodyClassName="p-0">
          {upcomingRegs.length ? (
            <ul className="divide-y divide-slate-100">
              {upcomingRegs.slice(0, 5).map(({ event: e }) => (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-brand-50/50">
                    <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-brand-50 py-2">
                      <span className="text-[10px] font-semibold text-gold-600 uppercase">{formatMonth(e.startAt)}</span>
                      <span className="font-display text-xl leading-none font-bold text-brand-800">{formatDay(e.startAt)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{e.title}</p>
                      <p className="truncate text-sm text-slate-500">{e.club.name}</p>
                      <p className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
                        <span>{formatWeekday(e.startAt)}, {formatTime(e.startAt)}</span>
                        <span className="flex min-w-0 items-center gap-1 truncate"><MapPin className="size-3" />{e.venue}</span>
                      </p>
                    </div>
                    <StatusBadge status="REGISTERED" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="m-5" icon={CalendarDays} title="No upcoming registrations" action={<Link href="/events" className="btn btn-primary btn-sm">Find events</Link>} />
          )}
        </Card>

        <Card title="My clubs" actions={<Link href="/student/clubs" className="text-sm font-semibold text-brand-600 hover:underline">Manage</Link>}>
          {memberships.length ? (
            <ul className="space-y-3">
              {memberships.slice(0, 6).map((m) => (
                <li key={m.id}>
                  <Link href={`/clubs/${m.club.slug}`} className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-brand-50">
                    <ClubLogo name={m.club.name} src={m.club.logo} category={m.club.category} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{m.club.name}</span>
                      <span className="text-xs text-slate-500">{m.position}</span>
                    </span>
                    <StatusBadge status={m.status} label={m.status === "APPROVED" ? "Member" : undefined} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Users} title="You haven't joined a club yet" action={<Link href="/clubs" className="btn btn-primary btn-sm">Explore clubs</Link>} />
          )}
        </Card>
      </div>

      {suggested.length > 0 && (
        <Card title={joined.length ? "Coming up in your clubs" : "Recommended for you"}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {suggested.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="rounded-xl border border-slate-100 p-4 transition hover:border-brand-200 hover:bg-brand-50/40">
                <p className="text-xs font-semibold text-brand-600">{e.club.name}</p>
                <p className="mt-1 line-clamp-2 font-medium text-slate-900">{e.title}</p>
                <p className="mt-2 text-xs text-slate-500">{formatWeekday(e.startAt)} {formatDay(e.startAt)} {formatMonth(e.startAt)} · {formatTime(e.startAt)}</p>
                <p className="mt-1 text-xs text-slate-400">{e._count.registrations} registered</p>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Latest announcements</h2>
          <Link href="/student/announcements" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">{announcements.map((a) => <AnnouncementCard key={a.id} a={a} compact />)}</div>
      </section>
    </div>
  );
}
