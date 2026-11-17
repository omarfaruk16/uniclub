import type { Metadata } from "next";
import { CalendarCheck, Percent, Users, ClipboardList } from "lucide-react";
import { db } from "@/lib/db";
import { requireRepClub } from "@/lib/rep";
import { Card, PageHeader, StatCard } from "@/components/ui";
import { BarList, ColumnChart, Donut } from "@/components/charts";
import { lastMonths, monthKey } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const { club } = await requireRepClub();
  const now = new Date();
  const [members, events, regs, memberships] = await Promise.all([
    db.membership.count({ where: { clubId: club.id, status: "APPROVED" } }),
    db.event.findMany({
      where: { clubId: club.id, status: "PUBLISHED" },
      orderBy: { startAt: "desc" },
      include: { registrations: { select: { status: true, attendance: true } } },
    }),
    db.registration.findMany({ where: { event: { clubId: club.id } }, select: { createdAt: true, status: true, attendance: true, event: { select: { endAt: true } } } }),
    db.membership.findMany({ where: { clubId: club.id, status: "APPROVED" }, select: { createdAt: true } }),
  ]);
  const active = regs.filter((r) => r.status === "REGISTERED");
  const pastActive = active.filter((r) => r.event.endAt < now);
  const attended = pastActive.filter((r) => r.attendance === "ATTENDED").length;
  const absent = pastActive.filter((r) => r.attendance === "ABSENT").length;
  const rate = attended + absent ? Math.round((attended / (attended + absent)) * 100) : 0;

  const months = lastMonths(6);
  const regByMonth = months.map((m) => ({ label: m.label, value: active.filter((r) => monthKey(r.createdAt) === m.key).length }));
  const membersByMonth = months.map((m) => ({ label: m.label, value: memberships.filter((r) => monthKey(r.createdAt) === m.key).length }));
  const perEvent = events.slice(0, 8).map((e) => ({ label: e.title, value: e.registrations.filter((r) => r.status === "REGISTERED").length }));
  const participation = events
    .filter((e) => e.endAt < now)
    .slice(0, 6)
    .reverse()
    .map((e) => {
      const r = e.registrations.filter((x) => x.status === "REGISTERED");
      return { label: e.title.length > 14 ? e.title.slice(0, 13) + "…" : e.title, value: r.length, secondary: r.filter((x) => x.attendance === "ATTENDED").length };
    });

  return (
    <>
      <PageHeader title="Reports" description={`Registration and participation statistics for ${club.name}.`} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Members" value={members} icon={Users} />
        <StatCard label="Published events" value={events.length} icon={CalendarCheck} tone="blue" />
        <StatCard label="Total registrations" value={active.length} icon={ClipboardList} tone="violet" />
        <StatCard label="Attendance rate" value={`${rate}%`} icon={Percent} tone="gold" hint={`${attended} attended · ${absent} absent`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Registrations per month"><ColumnChart data={regByMonth} /></Card>
        <Card title="New members per month"><ColumnChart data={membersByMonth} color="bg-gold-400" /></Card>
        <Card title="Registrations by event"><BarList data={perEvent} /></Card>
        <Card title="Attendance (past events)">
          <Donut centerLabel="registrants" data={[{ label: "Attended", value: attended }, { label: "Absent", value: absent }, { label: "Not marked", value: pastActive.length - attended - absent }]} />
        </Card>
        <Card title="Participation: registered vs attended" className="xl:col-span-2">
          {participation.length ? (
            <>
              <ColumnChart data={participation} />
              <div className="mt-3 flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand-500" /> Registered</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-gold-400" /> Attended</span>
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">No completed events yet.</p>
          )}
        </Card>
      </div>
    </>
  );
}
