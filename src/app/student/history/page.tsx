import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { formatDate, formatTime } from "@/lib/utils";
import { CheckCircle2, XCircle, CircleDashed } from "lucide-react";

export const metadata: Metadata = { title: "Event History" };

export default async function EventHistoryPage() {
  const user = await requireUser();
  const regs = await db.registration.findMany({
    where: { userId: user.id, event: { endAt: { lt: new Date() } } },
    include: { event: { include: { club: { select: { name: true, slug: true } } } } },
    orderBy: { event: { startAt: "desc" } },
  });
  const count = (a: string) => regs.filter((r) => r.status === "REGISTERED" && r.attendance === a).length;

  return (
    <>
      <PageHeader title="Event History" description="Past events you registered for and your participation status." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Attended" value={count("ATTENDED")} icon={CheckCircle2} />
        <StatCard label="Missed" value={count("ABSENT")} icon={XCircle} tone="rose" />
        <StatCard label="Not yet recorded" value={count("PENDING")} icon={CircleDashed} tone="slate" />
      </div>
      {regs.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Event</th><th>Club</th><th>Date</th><th>Participation</th></tr></thead>
            <tbody>
              {regs.map(({ event: e, ...r }) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/events/${e.id}`} className="font-medium text-slate-900 hover:text-brand-700">{e.title}</Link>
                    <p className="text-xs text-slate-400">{e.category} · {e.venue}</p>
                  </td>
                  <td><Link href={`/clubs/${e.club.slug}`} className="text-brand-600 hover:underline">{e.club.name}</Link></td>
                  <td className="whitespace-nowrap">{formatDate(e.startAt)}<p className="text-xs text-slate-400">{formatTime(e.startAt)}</p></td>
                  <td>
                    {e.status === "CANCELLED" ? (
                      <StatusBadge status="CANCELLED" label="Event cancelled" />
                    ) : r.status === "CANCELLED" ? (
                      <StatusBadge status="CANCELLED" label="Registration cancelled" />
                    ) : (
                      <StatusBadge status={r.attendance} label={r.attendance === "PENDING" ? "Not recorded" : undefined} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={History} title="No past events yet" description="Once you attend events, your history will appear here." />
      )}
    </>
  );
}
