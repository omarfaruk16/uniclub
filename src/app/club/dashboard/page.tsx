import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CalendarDays, Check, ClipboardList, UserPlus, Users, X } from "lucide-react";
import { db } from "@/lib/db";
import { getRepClub, requireRole } from "@/lib/auth";
import { Card, CardLink, EmptyState, MetricCard, StatusBadge } from "@/components/ui";
import { ColumnChart } from "@/components/charts";
import { ChartTotal, DateTile, OverviewHeader } from "@/components/overview";
import { Avatar } from "@/components/visuals";
import { QuickAction } from "@/components/confirm";
import { approveMemberAction, rejectMemberAction } from "@/app/actions/club";
import { formatDay, formatMonth, formatShortDate, formatTime, formatWeekday, lastMonths, monthKey, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Club Dashboard" };

export default async function ClubDashboard() {
  const user = await requireRole(["REP"]);
  const club = await getRepClub(user.id);
  if (!club)
    return (
      <EmptyState
        icon={Building2}
        title="No club assigned yet"
        description="You're registered as a club representative, but the administrator hasn't assigned you a club. Please contact the Student Affairs Office."
        action={<Link href="/student/dashboard" className="btn btn-primary">Go to student dashboard</Link>}
      />
    );

  const now = new Date();
  const months = lastMonths(6);
  const since = new Date(now.getTime() - 200 * 864e5);
  const monthStart = new Date(now.getTime() - 30 * 864e5);
  const [members, newMembers, upcoming, totalRegs, pendingList, pendingCount, recentRegs, regRows, attendance] = await Promise.all([
    db.membership.count({ where: { clubId: club.id, status: "APPROVED" } }),
    db.membership.count({ where: { clubId: club.id, status: "APPROVED", createdAt: { gte: monthStart } } }),
    db.event.findMany({
      where: { clubId: club.id, status: "PUBLISHED", endAt: { gte: now } },
      orderBy: { startAt: "asc" },
      take: 6,
      include: { _count: { select: { registrations: { where: { status: "REGISTERED" } } } } },
    }),
    db.registration.count({ where: { status: "REGISTERED", event: { clubId: club.id } } }),
    db.membership.findMany({ where: { clubId: club.id, status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 5, include: { user: true } }),
    db.membership.count({ where: { clubId: club.id, status: "PENDING" } }),
    db.registration.findMany({
      where: { status: "REGISTERED", event: { clubId: club.id } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { name: true, avatar: true } }, event: { select: { title: true } } },
    }),
    db.registration.findMany({ where: { status: "REGISTERED", createdAt: { gte: since }, event: { clubId: club.id } }, select: { createdAt: true } }),
    db.registration.groupBy({ by: ["attendance"], where: { status: "REGISTERED", event: { clubId: club.id, endAt: { lt: now } } }, _count: true }),
  ]);
  const att = (k: string) => attendance.find((a) => a.attendance === k)?._count ?? 0;
  const marked = att("ATTENDED") + att("ABSENT");
  const byMonth = months.map((m) => ({ label: m.label, value: regRows.filter((r) => monthKey(r.createdAt) === m.key).length }));
  const next = upcoming[0];

  return (
    <div className="space-y-5 sm:space-y-6">
      <OverviewHeader title={club.name} text={`Welcome back, ${user.name.split(" ")[0]}. Here is how your club is doing.`}>
        <Link href={`/clubs/${club.slug}`} className="btn btn-outline">Public page</Link>
      </OverviewHeader>

      {club.status !== "APPROVED" && (
        <div className="rounded-2xl border border-gold-200 bg-gold-50 p-4 text-sm text-gold-700">
          Your club is currently <strong>{club.status.toLowerCase()}</strong>. It is hidden from the public site and cannot publish events until an administrator approves it.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <MetricCard featured icon={Users} title="Members" subtitle="Approved club members" value={members} chip={newMembers ? `+${newMembers} this month` : undefined} href="/club/members" linkLabel="Manage members" />
        <MetricCard
          icon={CalendarDays}
          title="Upcoming events"
          subtitle="Published and not yet over"
          value={upcoming.length}
          chip={next ? `Next: ${formatWeekday(next.startAt)} ${formatDay(next.startAt)} ${formatMonth(next.startAt)}` : undefined}
          href="/club/events"
          linkLabel="Manage events"
        />
        <MetricCard
          icon={ClipboardList}
          title="Registrations"
          subtitle="Active sign-ups across events"
          value={totalRegs}
          chip={marked ? `${Math.round((att("ATTENDED") / marked) * 100)}% attended` : undefined}
          href="/club/registrations"
          linkLabel="View registrations"
        />
      </div>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1fr_1.15fr]">
        <Card title="Membership requests" subtitle={pendingCount ? `${pendingCount} waiting for your decision` : "Nobody is waiting"} actions={<CardLink href="/club/members?tab=pending" />}>
          {pendingList.length ? (
            <ul className="space-y-2">
              {pendingList.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line bg-slate-50/60 p-3">
                  <Avatar name={m.user.name} src={m.user.avatar} size={36} className="ring-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{m.user.name}</p>
                    <p className="truncate text-xs text-slate-500">{m.user.studentId ?? m.user.email} · {timeAgo(m.createdAt)}</p>
                  </div>
                  <QuickAction action={approveMemberAction} fields={{ membershipId: m.id }} title="Approve" className="flex size-9 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"><Check className="size-4" /></QuickAction>
                  <QuickAction action={rejectMemberAction} fields={{ membershipId: m.id }} title="Decline" className="flex size-9 items-center justify-center rounded-full border border-line bg-white text-slate-500 hover:border-red-200 hover:text-red-600"><X className="size-4" /></QuickAction>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="border-0 py-8" icon={UserPlus} title="No pending requests" description="New membership requests will show up here." />
          )}
        </Card>

        <Card title="Registrations" subtitle="Sign-ups for your events, last 6 months">
          <ChartTotal label="Active registrations" value={totalRegs} note={`${regRows.length} in the last 6 months`} />
          <ColumnChart data={byMonth} height={170} valueLabel="Registrations" />
        </Card>
      </div>

      <Card title="Upcoming events" subtitle="Seats filled for each published event" actions={<CardLink href="/club/events">Manage</CardLink>} bodyClassName="p-2 sm:p-3">
        {upcoming.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="table">
                <thead>
                  <tr><th>Event</th><th>Date</th><th>Time</th><th>Venue</th><th>Registrations</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {upcoming.map((e) => {
                    const pct = e.capacity ? Math.min(100, (e._count.registrations / e.capacity) * 100) : null;
                    return (
                      <tr key={e.id}>
                        <td><Link href={`/club/registrations?event=${e.id}`} className="font-medium text-slate-900 hover:text-brand-700">{e.title}</Link></td>
                        <td className="whitespace-nowrap">{formatShortDate(e.startAt)}</td>
                        <td className="whitespace-nowrap">{formatTime(e.startAt)}</td>
                        <td className="max-w-44 truncate">{e.venue}</td>
                        <td className="min-w-40">
                          <div className="flex items-center gap-2">
                            <span className="w-14 text-sm font-semibold text-slate-900 tabular-nums">{e._count.registrations}{e.capacity ? `/${e.capacity}` : ""}</span>
                            {pct !== null && (
                              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <span className="block h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                              </span>
                            )}
                          </div>
                        </td>
                        <td><StatusBadge status={e.startAt <= now ? "ONGOING" : "UPCOMING"} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-line md:hidden">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <Link href={`/club/registrations?event=${e.id}`} className="flex items-center gap-3 px-2 py-3">
                    <DateTile month={formatMonth(e.startAt)} day={formatDay(e.startAt)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{e.title}</p>
                      <p className="truncate text-xs text-slate-500">{formatTime(e.startAt)} · {e.venue}</p>
                    </div>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-bold text-slate-900">{e._count.registrations}</span>
                      <span className="text-[11px] text-slate-400">{e.capacity ? `of ${e.capacity}` : "going"}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState className="m-2 border-0" icon={CalendarDays} title="No upcoming events" action={<Link href="/club/events/new" className="btn btn-primary btn-sm">Create an event</Link>} />
        )}
      </Card>

      <Card title="Recent registrations" actions={<CardLink href="/club/registrations" />}>
        {recentRegs.length ? (
          <ul className="grid gap-x-6 gap-y-3 md:grid-cols-2">
            {recentRegs.map((r) => (
              <li key={r.id} className="flex items-center gap-3">
                <Avatar name={r.user.name} src={r.user.avatar} size={34} className="ring-0" />
                <p className="min-w-0 flex-1 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{r.user.name}</span> registered for{" "}
                  <span className="font-medium text-slate-800">{r.event.title}</span>
                </p>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-sm text-slate-400">No registrations yet.</p>
        )}
      </Card>
    </div>
  );
}
