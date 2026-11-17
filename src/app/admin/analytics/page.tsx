import type { Metadata } from "next";
import { Building2, CalendarDays, ClipboardList, GraduationCap, Percent, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, PageHeader, StatCard } from "@/components/ui";
import { BarList, ColumnChart, Donut } from "@/components/charts";
import { lastMonths, monthKey } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics & Reports" };

export default async function AnalyticsPage() {
  await requireRole(["ADMIN"]);
  const now = new Date();
  const months = lastMonths(6);
  const [users, regs, events, clubs, memberships] = await Promise.all([
    db.user.findMany({ select: { createdAt: true, role: true } }),
    db.registration.findMany({ select: { createdAt: true, status: true, attendance: true, event: { select: { endAt: true } } } }),
    db.event.findMany({ where: { status: "PUBLISHED" }, select: { category: true, startAt: true } }),
    db.club.findMany({
      where: { status: "APPROVED" },
      select: { name: true, category: true, _count: { select: { memberships: { where: { status: "APPROVED" } }, events: { where: { status: "PUBLISHED" } } } } },
    }),
    db.membership.count({ where: { status: "APPROVED" } }),
  ]);
  const active = regs.filter((r) => r.status === "REGISTERED");
  const past = active.filter((r) => r.event.endAt < now);
  const attended = past.filter((r) => r.attendance === "ATTENDED").length;
  const absent = past.filter((r) => r.attendance === "ABSENT").length;
  const rate = attended + absent ? Math.round((attended / (attended + absent)) * 100) : 0;
  const newThisMonth = users.filter((u) => monthKey(u.createdAt) === months.at(-1)!.key).length;

  const group = <T,>(items: T[], key: (t: T) => string) => {
    const m = new Map<string, number>();
    for (const i of items) m.set(key(i), (m.get(key(i)) ?? 0) + 1);
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  };

  return (
    <>
      <PageHeader title="Analytics & Reports" description="Platform-wide statistics for clubs, students, events and participation." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Students" value={users.filter((u) => u.role !== "ADMIN").length} icon={GraduationCap} hint={`${newThisMonth} joined this month`} />
        <StatCard label="Active clubs" value={clubs.length} icon={Building2} tone="blue" hint={`${memberships} memberships`} />
        <StatCard label="Published events" value={events.length} icon={CalendarDays} tone="gold" />
        <StatCard label="Registrations" value={active.length} icon={ClipboardList} tone="violet" />
        <StatCard label="Attendance rate" value={`${rate}%`} icon={Percent} tone="brand" hint={`${attended} attended of ${attended + absent} marked`} />
        <StatCard label="Avg. members per club" value={clubs.length ? Math.round(memberships / clubs.length) : 0} icon={UserPlus} tone="rose" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Event registrations per month">
          <ColumnChart data={months.map((m) => ({ label: m.label, value: active.filter((r) => monthKey(r.createdAt) === m.key).length }))} />
        </Card>
        <Card title="New accounts per month">
          <ColumnChart color="bg-gold-400" data={months.map((m) => ({ label: m.label, value: users.filter((u) => monthKey(u.createdAt) === m.key).length }))} />
        </Card>
        <Card title="Events per month">
          <ColumnChart color="bg-sky-600" data={months.map((m) => ({ label: m.label, value: events.filter((e) => monthKey(e.startAt) === m.key).length }))} />
        </Card>
        <Card title="Events by category"><Donut centerLabel="events" data={group(events, (e) => e.category)} /></Card>
        <Card title="Largest clubs (members)">
          <BarList data={[...clubs].sort((a, b) => b._count.memberships - a._count.memberships).slice(0, 8).map((c) => ({ label: c.name, value: c._count.memberships }))} />
        </Card>
        <Card title="Most active clubs (events)">
          <BarList color="bg-gold-400" data={[...clubs].sort((a, b) => b._count.events - a._count.events).slice(0, 8).map((c) => ({ label: c.name, value: c._count.events }))} />
        </Card>
        <Card title="Clubs by category"><Donut centerLabel="clubs" data={group(clubs, (c) => c.category)} /></Card>
        <Card title="Accounts by role">
          <Donut centerLabel="accounts" data={[{ label: "Students", value: users.filter((u) => u.role === "STUDENT").length }, { label: "Club representatives", value: users.filter((u) => u.role === "REP").length }, { label: "Administrators", value: users.filter((u) => u.role === "ADMIN").length }]} />
        </Card>
      </div>
    </>
  );
}
