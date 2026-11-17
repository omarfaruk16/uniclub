import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CalendarDays, ClipboardList, GraduationCap, Check } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, StatCard, StatusBadge } from "@/components/ui";
import { ColumnChart, Donut } from "@/components/charts";
import { Avatar, ClubLogo } from "@/components/visuals";
import { ConfirmAction } from "@/components/confirm";
import { approveClubAction } from "@/app/actions/admin";
import { formatDate, lastMonths, monthKey, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  const user = await requireRole(["ADMIN"]);
  const now = new Date();
  const months = lastMonths(6);
  const since = new Date(now.getTime() - 200 * 864e5);
  const [clubs, pendingClubs, students, events, upcomingEvents, regs, regRows, pending, newUsers, regStatus] = await Promise.all([
    db.club.count({ where: { status: "APPROVED" } }),
    db.club.count({ where: { status: "PENDING" } }),
    db.user.count({ where: { role: { in: ["STUDENT", "REP"] } } }),
    db.event.count({ where: { status: "PUBLISHED" } }),
    db.event.count({ where: { status: "PUBLISHED", startAt: { gte: now } } }),
    db.registration.count({ where: { status: "REGISTERED" } }),
    db.registration.findMany({ where: { createdAt: { gte: since }, status: "REGISTERED" }, select: { createdAt: true } }),
    db.club.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 5, include: { proposedBy: { select: { name: true } } } }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    db.registration.groupBy({ by: ["attendance"], where: { status: "REGISTERED", event: { endAt: { lt: now } } }, _count: true }),
  ]);
  const regByMonth = months.map((m) => ({ label: m.label, value: regRows.filter((r) => monthKey(r.createdAt) === m.key).length }));
  const att = (k: string) => regStatus.find((r) => r.attendance === k)?._count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user.name.split(" ").slice(-1)[0]}</h1>
        <p className="text-sm text-slate-500">Here&apos;s an overview of club and event activity across campus.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total clubs" value={clubs} icon={Building2} hint={`${pendingClubs} awaiting approval`} />
        <StatCard label="Total students" value={students} icon={GraduationCap} tone="blue" />
        <StatCard label="Total events" value={events} icon={CalendarDays} tone="gold" hint={`${upcomingEvents} upcoming`} />
        <StatCard label="Registrations" value={regs} icon={ClipboardList} tone="violet" hint="active registrations" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card title="Registration statistics" actions={<Link href="/admin/analytics" className="text-sm font-semibold text-brand-600 hover:underline">Analytics</Link>}>
          <ColumnChart data={regByMonth} height={200} />
        </Card>
        <Card title="Attendance at past events">
          <Donut centerLabel="registrants" data={[{ label: "Attended", value: att("ATTENDED") }, { label: "Absent", value: att("ABSENT") }, { label: "Not marked", value: att("PENDING") }]} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Clubs awaiting approval" actions={<Link href="/admin/clubs?status=PENDING" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>}>
          {pending.length ? (
            <ul className="space-y-3">
              {pending.map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <ClubLogo name={c.name} src={c.logo} category={c.category} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.category} · proposed {c.proposedBy ? `by ${c.proposedBy.name} ` : ""}{timeAgo(c.createdAt)}</p>
                  </div>
                  <ConfirmAction action={approveClubAction} fields={{ clubId: c.id }} tone="primary" className="btn btn-sm btn-primary" icon={<Check className="size-3.5" />} label="Approve" title={`Approve ${c.name}?`} message={c.proposedBy ? `${c.proposedBy.name} will become the club's representative.` : "The club will appear on the public site."} confirmLabel="Approve" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">No clubs waiting for review.</p>
          )}
        </Card>
        <Card title="Newest accounts" actions={<Link href="/admin/users" className="text-sm font-semibold text-brand-600 hover:underline">Manage users</Link>}>
          <ul className="space-y-3">
            {newUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-3">
                <Avatar name={u.name} src={u.avatar} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{u.name}</p>
                  <p className="truncate text-xs text-slate-500">{u.email} · {formatDate(u.createdAt)}</p>
                </div>
                <StatusBadge status={u.role} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
