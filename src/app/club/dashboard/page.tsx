import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CalendarPlus, ClipboardList, UserPlus, Users, Building2, Check, X } from "lucide-react";
import { db } from "@/lib/db";
import { getRepClub, requireRole } from "@/lib/auth";
import { Card, EmptyState, StatCard, StatusBadge } from "@/components/ui";
import { Avatar, ClubLogo, Cover } from "@/components/visuals";
import { QuickAction } from "@/components/confirm";
import { approveMemberAction, rejectMemberAction } from "@/app/actions/club";
import { formatDate, formatTime, timeAgo } from "@/lib/utils";

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
  const [members, pending, upcoming, totalRegs, pendingList, recentRegs] = await Promise.all([
    db.membership.count({ where: { clubId: club.id, status: "APPROVED" } }),
    db.membership.count({ where: { clubId: club.id, status: "PENDING" } }),
    db.event.findMany({
      where: { clubId: club.id, status: "PUBLISHED", endAt: { gte: now } },
      orderBy: { startAt: "asc" },
      take: 5,
      include: { _count: { select: { registrations: { where: { status: "REGISTERED" } } } } },
    }),
    db.registration.count({ where: { status: "REGISTERED", event: { clubId: club.id } } }),
    db.membership.findMany({ where: { clubId: club.id, status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 5, include: { user: true } }),
    db.registration.findMany({
      where: { status: "REGISTERED", event: { clubId: club.id } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { name: true, avatar: true } }, event: { select: { title: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <Cover src={club.cover} seed={club.name} category={club.category} className="h-28 sm:h-36" />
        <div className="flex flex-col gap-4 px-5 pb-5 sm:px-6 xl:flex-row xl:items-end">
          <div className="flex flex-1 items-end gap-4">
            <ClubLogo name={club.name} src={club.logo} category={club.category} size={84} className="-mt-10 shrink-0 shadow-md ring-4 ring-white" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold sm:text-2xl">{club.name}</h1>
                <StatusBadge status={club.status} />
              </div>
              <p className="text-sm text-slate-500">Welcome back, {user.name.split(" ")[0]}. Here&apos;s how your club is doing.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/clubs/${club.slug}`} className="btn btn-outline">View public page</Link>
            <Link href="/club/events/new" className="btn btn-primary"><CalendarPlus className="size-4" /> Create event</Link>
          </div>
        </div>
      </section>
      {club.status !== "APPROVED" && (
        <div className="rounded-2xl border border-gold-200 bg-gold-50 p-4 text-sm text-gold-700">
          Your club is currently <strong>{club.status.toLowerCase()}</strong>. It is hidden from the public site and cannot publish events until an administrator approves it.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Members" value={members} icon={Users} />
        <StatCard label="Pending requests" value={pending} icon={UserPlus} tone="gold" />
        <StatCard label="Upcoming events" value={upcoming.length} icon={CalendarDays} tone="blue" />
        <StatCard label="Active registrations" value={totalRegs} icon={ClipboardList} tone="violet" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Upcoming events" actions={<Link href="/club/events" className="text-sm font-semibold text-brand-600 hover:underline">Manage</Link>} bodyClassName="p-0">
          {upcoming.length ? (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((e) => {
                const pct = e.capacity ? Math.min(100, (e._count.registrations / e.capacity) * 100) : null;
                return (
                  <li key={e.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <Link href={`/club/registrations?event=${e.id}`} className="font-medium text-slate-900 hover:text-brand-700">{e.title}</Link>
                      <p className="text-xs text-slate-500">{formatDate(e.startAt)} · {formatTime(e.startAt)} · {e.venue}</p>
                      {pct !== null && (
                        <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-brand-50">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-slate-900">{e._count.registrations}</p>
                      <p className="text-xs text-slate-500">{e.capacity ? `of ${e.capacity}` : "registered"}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState className="m-5" icon={CalendarDays} title="No upcoming events" action={<Link href="/club/events/new" className="btn btn-primary btn-sm">Create an event</Link>} />
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Membership requests" actions={<Link href="/club/members?tab=pending" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>}>
            {pendingList.length ? (
              <ul className="space-y-3">
                {pendingList.map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <Avatar name={m.user.name} src={m.user.avatar} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{m.user.name}</p>
                      <p className="text-xs text-slate-500">{m.user.studentId} · {timeAgo(m.createdAt)}</p>
                    </div>
                    <QuickAction action={approveMemberAction} fields={{ membershipId: m.id }} title="Approve" className="rounded-lg bg-brand-50 p-2 text-brand-700 hover:bg-brand-100"><Check className="size-4" /></QuickAction>
                    <QuickAction action={rejectMemberAction} fields={{ membershipId: m.id }} title="Decline" className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"><X className="size-4" /></QuickAction>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-slate-400">No pending requests.</p>
            )}
          </Card>
          <Card title="Recent registrations">
            {recentRegs.length ? (
              <ul className="space-y-3">
                {recentRegs.map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <Avatar name={r.user.name} src={r.user.avatar} size={32} />
                    <p className="min-w-0 flex-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">{r.user.name}</span> registered for <span className="font-medium text-slate-800">{r.event.title}</span>
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
      </div>
    </div>
  );
}
