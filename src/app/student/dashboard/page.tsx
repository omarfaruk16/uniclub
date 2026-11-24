import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, CalendarDays, MapPin, Plus, Trophy, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ACTIVE_REGS, PUBLIC_EVENT } from "@/lib/queries";
import { Card, CardLink, EmptyState, MetricCard, StatusBadge } from "@/components/ui";
import { ColumnChart } from "@/components/charts";
import { ChartTotal, DateTile, OverviewHeader } from "@/components/overview";
import { ClubLogo } from "@/components/visuals";
import { cn, formatDay, formatMonth, formatShortDate, formatTime, formatWeekday, lastMonths, monthKey, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Student Dashboard" };

export default async function StudentDashboard() {
  const user = await requireUser();
  const now = new Date();
  const months = lastMonths(6);
  const since = new Date(now.getTime() - 200 * 864e5);
  const [memberships, upcomingRegs, attendance, myRegs] = await Promise.all([
    db.membership.findMany({
      where: { userId: user.id, status: { in: ["APPROVED", "PENDING"] } },
      include: { club: { select: { name: true, slug: true, logo: true, category: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.registration.findMany({
      where: { userId: user.id, status: "REGISTERED", event: { endAt: { gte: now }, status: "PUBLISHED" } },
      include: { event: { include: { club: { select: { name: true, slug: true, logo: true, category: true } } } } },
      orderBy: { event: { startAt: "asc" } },
    }),
    db.registration.groupBy({ by: ["attendance"], where: { userId: user.id, status: "REGISTERED", event: { endAt: { lt: now } } }, _count: true }),
    db.registration.findMany({ where: { userId: user.id, createdAt: { gte: since } }, select: { createdAt: true } }),
  ]);
  const joined = memberships.filter((m) => m.status === "APPROVED").map((m) => m.clubId);
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
      take: 4,
      include: { club: { select: { name: true } } },
    }),
  ]);

  const att = (k: string) => attendance.find((a) => a.attendance === k)?._count ?? 0;
  const attended = att("ATTENDED");
  const marked = attended + att("ABSENT");
  const pending = memberships.length - joined.length;
  const next = upcomingRegs[0]?.event;
  const byMonth = months.map((m) => ({ label: m.label, value: myRegs.filter((r) => monthKey(r.createdAt) === m.key).length }));
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", hour: "numeric", hour12: false }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-5 sm:space-y-6">
      <OverviewHeader title="Overview" text={`${greeting}, ${user.name.split(" ")[0]}. Here is your campus summary.`}>
        <Link href="/clubs" className="btn btn-outline">Explore clubs</Link>
      </OverviewHeader>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <MetricCard
          featured
          icon={CalendarCheck}
          title="Upcoming events"
          subtitle="Events you are registered for"
          value={upcomingRegs.length}
          chip={next ? `Next: ${formatWeekday(next.startAt)} ${formatDay(next.startAt)} ${formatMonth(next.startAt)}` : undefined}
          href="/student/registrations"
          linkLabel="See registrations"
        />
        <MetricCard
          icon={Users}
          title="Clubs joined"
          subtitle="Approved memberships"
          value={joined.length}
          chip={pending ? `${pending} pending` : undefined}
          href="/student/clubs"
          linkLabel="Manage clubs"
        />
        <MetricCard
          icon={Trophy}
          title="Events attended"
          subtitle="Your participation record"
          value={attended}
          chip={marked ? `${Math.round((attended / marked) * 100)}% attendance` : undefined}
          href="/student/history"
          linkLabel="View history"
        />
      </div>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1fr_1.15fr]">
        <Card title="My clubs" subtitle={`${joined.length} joined${pending ? ` · ${pending} waiting for approval` : ""}`} actions={<Link href="/clubs" className="btn btn-outline btn-sm"><Plus className="size-3.5" /> Join</Link>}>
          {memberships.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {memberships.slice(0, 4).map((m) => (
                <Link key={m.id} href={`/clubs/${m.club.slug}`} className="rounded-xl border border-line bg-slate-50/60 p-3.5 transition hover:border-slate-300 hover:bg-white">
                  <div className="flex items-center gap-3">
                    <ClubLogo name={m.club.name} src={m.club.logo} category={m.club.category} size={36} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{m.club.name}</p>
                      <p className="truncate text-xs text-slate-500">{m.club.category}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{m.position}</span>
                    <span className={cn("inline-flex items-center gap-1.5 font-medium", m.status === "APPROVED" ? "text-brand-600" : "text-gold-600")}>
                      <span className={cn("size-1.5 rounded-full", m.status === "APPROVED" ? "bg-brand-500" : "bg-gold-500")} />
                      {m.status === "APPROVED" ? "Member" : "Pending"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="You haven't joined a club yet" action={<Link href="/clubs" className="btn btn-primary btn-sm">Explore clubs</Link>} />
          )}
          {memberships.length > 4 && <Link href="/student/clubs" className="mt-3 block text-center text-sm font-semibold text-slate-600 hover:text-slate-900">+{memberships.length - 4} more</Link>}
        </Card>

        <Card title="Event registrations" subtitle="How often you signed up, last 6 months">
          <ChartTotal label="Total registrations" value={myRegs.length} note="in the last 6 months" />
          <ColumnChart data={byMonth} height={170} valueLabel="Registrations" />
        </Card>
      </div>

      <Card title="Upcoming events" subtitle="Events you are registered for" actions={<CardLink href="/student/registrations" />} bodyClassName="p-2 sm:p-3">
        {upcomingRegs.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="table">
                <thead>
                  <tr><th>Event</th><th>Club</th><th>Date</th><th>Time</th><th>Venue</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {upcomingRegs.slice(0, 6).map(({ event: e }) => (
                    <tr key={e.id}>
                      <td><Link href={`/events/${e.id}`} className="font-medium text-slate-900 hover:text-brand-700">{e.title}</Link></td>
                      <td>
                        <span className="flex items-center gap-2">
                          <ClubLogo name={e.club.name} src={e.club.logo} category={e.club.category} size={24} />
                          <span className="truncate">{e.club.name}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap">{formatShortDate(e.startAt)}</td>
                      <td className="whitespace-nowrap">{formatTime(e.startAt)}</td>
                      <td className="max-w-48 truncate">{e.venue}</td>
                      <td><StatusBadge status="REGISTERED" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-line md:hidden">
              {upcomingRegs.slice(0, 6).map(({ event: e }) => (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="flex items-center gap-3 px-2 py-3">
                    <DateTile month={formatMonth(e.startAt)} day={formatDay(e.startAt)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{e.title}</p>
                      <p className="truncate text-xs text-slate-500">{e.club.name} · {formatTime(e.startAt)}</p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400"><MapPin className="size-3 shrink-0" />{e.venue}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState className="m-2 border-0" icon={CalendarDays} title="No upcoming registrations" description="Find an event you like and register in one tap." action={<Link href="/events" className="btn btn-primary btn-sm">Find events</Link>} />
        )}
      </Card>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-2">
        <Card title={joined.length ? "Coming up in your clubs" : "Recommended for you"} actions={<CardLink href="/events">All events</CardLink>}>
          {suggested.length ? (
            <ul className="space-y-1">
              {suggested.map((e) => (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50">
                    <DateTile month={formatMonth(e.startAt)} day={formatDay(e.startAt)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{e.title}</p>
                      <p className="truncate text-xs text-slate-500">{e.club.name} · {formatTime(e.startAt)}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{e._count.registrations} going</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">No new events right now.</p>
          )}
        </Card>
        <Card title="Latest announcements" actions={<CardLink href="/student/announcements" />}>
          {announcements.length ? (
            <ul className="space-y-1">
              {announcements.map((a) => (
                <li key={a.id} className="-mx-2 rounded-xl px-2 py-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn("size-1.5 rounded-full", a.category === "Urgent" ? "bg-red-500" : a.pinned ? "bg-gold-500" : "bg-brand-500")} />
                    <span className="font-medium text-slate-500">{a.club?.name ?? "University notice"}</span>
                    <span className="ml-auto text-slate-400">{timeAgo(a.createdAt)}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">{a.title}</p>
                  <p className="line-clamp-1 text-xs text-slate-500">{a.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">No announcements yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
