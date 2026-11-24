import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CalendarDays, Check, GraduationCap } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, CardLink, EmptyState, MetricCard, StatusBadge } from "@/components/ui";
import { ColumnChart, Donut } from "@/components/charts";
import { ChartTotal, OverviewHeader } from "@/components/overview";
import { Avatar, ClubLogo } from "@/components/visuals";
import { ConfirmAction } from "@/components/confirm";
import { approveClubAction } from "@/app/actions/admin";
import { formatShortDate, lastMonths, monthKey, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  const user = await requireRole(["ADMIN"]);
  const now = new Date();
  const months = lastMonths(6);
  const since = new Date(now.getTime() - 200 * 864e5);
  const monthStart = new Date(now.getTime() - 30 * 864e5);
  const [clubs, pendingClubs, students, newStudents, events, upcomingEvents, regs, regRows, pending, newUsers, regStatus] = await Promise.all([
    db.club.count({ where: { status: "APPROVED" } }),
    db.club.count({ where: { status: "PENDING" } }),
    db.user.count({ where: { role: { in: ["STUDENT", "REP"] } } }),
    db.user.count({ where: { role: { in: ["STUDENT", "REP"] }, createdAt: { gte: monthStart } } }),
    db.event.count({ where: { status: "PUBLISHED" } }),
    db.event.count({ where: { status: "PUBLISHED", startAt: { gte: now } } }),
    db.registration.count({ where: { status: "REGISTERED" } }),
    db.registration.findMany({ where: { createdAt: { gte: since }, status: "REGISTERED" }, select: { createdAt: true } }),
    db.club.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 4, include: { proposedBy: { select: { name: true } } } }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    db.registration.groupBy({ by: ["attendance"], where: { status: "REGISTERED", event: { endAt: { lt: now } } }, _count: true }),
  ]);
  const regByMonth = months.map((m) => ({ label: m.label, value: regRows.filter((r) => monthKey(r.createdAt) === m.key).length }));
  const att = (k: string) => regStatus.find((r) => r.attendance === k)?._count ?? 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      <OverviewHeader title="Overview" text={`Welcome back, ${user.name.split(" ").slice(-1)[0]}. Here is the summary of club and event activity.`}>
        <Link href="/admin/analytics" className="btn btn-outline">Full analytics</Link>
      </OverviewHeader>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <MetricCard featured icon={GraduationCap} title="Students" subtitle="Registered student accounts" value={students} chip={newStudents ? `+${newStudents} this month` : undefined} href="/admin/users" linkLabel="Manage users" />
        <MetricCard icon={Building2} title="Active clubs" subtitle="Approved and visible" value={clubs} chip={pendingClubs ? `${pendingClubs} awaiting approval` : undefined} href="/admin/clubs" linkLabel="Manage clubs" />
        <MetricCard icon={CalendarDays} title="Published events" subtitle="Across every club" value={events} chip={`${upcomingEvents} upcoming`} href="/admin/events" linkLabel="Manage events" />
      </div>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1fr_1.15fr]">
        <Card title="Clubs awaiting approval" subtitle={pendingClubs ? `${pendingClubs} proposal${pendingClubs > 1 ? "s" : ""} to review` : "Nothing to review"} actions={<CardLink href="/admin/clubs?status=PENDING" />}>
          {pending.length ? (
            <ul className="space-y-2">
              {pending.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-xl border border-line bg-slate-50/60 p-3">
                  <ClubLogo name={c.name} src={c.logo} category={c.category} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{c.name}</p>
                    <p className="truncate text-xs text-slate-500">{c.category} · {c.proposedBy ? `by ${c.proposedBy.name} · ` : ""}{timeAgo(c.createdAt)}</p>
                  </div>
                  <ConfirmAction action={approveClubAction} fields={{ clubId: c.id }} tone="primary" className="btn btn-sm btn-primary" icon={<Check className="size-3.5" />} label="Approve" title={`Approve ${c.name}?`} message={c.proposedBy ? `${c.proposedBy.name} will become the club's representative.` : "The club will appear on the public site."} confirmLabel="Approve" />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="border-0 py-8" icon={Building2} title="No clubs waiting" description="New club proposals from students will show up here." />
          )}
        </Card>

        <Card title="Registrations" subtitle="Event sign-ups across campus, last 6 months">
          <ChartTotal label="Active registrations" value={regs} note={`${regRows.length} in the last 6 months`} />
          <ColumnChart data={regByMonth} height={170} valueLabel="Registrations" />
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Newest accounts" subtitle="Recently created users" actions={<CardLink href="/admin/users">Manage</CardLink>} bodyClassName="p-2 sm:p-3">
          <div className="hidden overflow-x-auto md:block">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Joined</th><th>Role</th></tr></thead>
              <tbody>
                {newUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="flex items-center gap-2.5">
                        <Avatar name={u.name} src={u.avatar} size={28} className="ring-0" />
                        <span className="truncate font-medium text-slate-900">{u.name}</span>
                      </span>
                    </td>
                    <td className="max-w-52 truncate text-slate-500">{u.email}</td>
                    <td className="max-w-40 truncate">{u.department ?? "—"}</td>
                    <td className="whitespace-nowrap">{formatShortDate(u.createdAt)}</td>
                    <td><StatusBadge status={u.role} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-line md:hidden">
            {newUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-2 py-3">
                <Avatar name={u.name} src={u.avatar} size={34} className="ring-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{u.name}</p>
                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                </div>
                <StatusBadge status={u.role} />
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Attendance" subtitle="Registrants at past events">
          <Donut centerLabel="registrants" data={[{ label: "Attended", value: att("ATTENDED") }, { label: "Absent", value: att("ABSENT") }, { label: "Not marked", value: att("PENDING") }]} />
        </Card>
      </div>
    </div>
  );
}
