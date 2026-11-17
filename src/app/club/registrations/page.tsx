import type { Metadata } from "next";
import { ClipboardList, Download, UserCheck, UserX, Users, Ban } from "lucide-react";
import { db } from "@/lib/db";
import { requireRepClub } from "@/lib/rep";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { Avatar } from "@/components/visuals";
import { QuickAction } from "@/components/confirm";
import { Filters } from "@/components/filters";
import { setAttendanceAction, setRegistrationStatusAction } from "@/app/actions/club";
import { cn, formatDate, formatDateTime, strParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Registrations" };

export default async function RegistrationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { club } = await requireRepClub();
  const sp = await searchParams;
  const events = await db.event.findMany({
    where: { clubId: club.id, status: { not: "DRAFT" } },
    orderBy: { startAt: "desc" },
    select: { id: true, title: true, startAt: true, capacity: true, status: true },
  });
  const now = new Date();
  const defaultEvent = events.filter((e) => e.startAt >= now).at(-1) ?? events[0];
  const eventId = strParam(sp.event) || defaultEvent?.id || "";
  const event = events.find((e) => e.id === eventId);
  const q = strParam(sp.q);
  const status = strParam(sp.status);

  const regs = event
    ? await db.registration.findMany({
        where: {
          eventId: event.id,
          ...(status ? { status } : {}),
          ...(q ? { user: { OR: [{ name: { contains: q } }, { studentId: { contains: q } }, { email: { contains: q } }] } } : {}),
        },
        orderBy: { createdAt: "asc" },
        include: { user: true },
      })
    : [];
  const all = event ? await db.registration.findMany({ where: { eventId: event.id }, select: { status: true, attendance: true } }) : [];
  const active = all.filter((r) => r.status === "REGISTERED");
  const started = event ? event.startAt <= now : false;

  return (
    <>
      <PageHeader
        title="Registrations"
        description="Registered students, their status and attendance for each event."
        actions={event && (
          <a href={`/club/registrations/export?event=${event.id}`} className="btn btn-outline"><Download className="size-4" /> Export CSV</a>
        )}
      />
      {events.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No events yet" description="Registrations appear here once you publish events." />
      ) : (
        <>
          <Filters
            placeholder="Search registrants…"
            selects={[
              { name: "event", label: "Choose event", options: events.map((e) => ({ value: e.id, label: `${e.title} (${formatDate(e.startAt)})` })) },
              { name: "status", label: "All statuses", options: [{ value: "REGISTERED", label: "Registered" }, { value: "CANCELLED", label: "Cancelled" }] },
            ]}
          />
          {event && (
            <>
              <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Registered" value={active.length} icon={Users} hint={event.capacity ? `Capacity ${event.capacity}` : "No capacity limit"} />
                <StatCard label="Attended" value={active.filter((r) => r.attendance === "ATTENDED").length} icon={UserCheck} tone="blue" />
                <StatCard label="Absent" value={active.filter((r) => r.attendance === "ABSENT").length} icon={UserX} tone="rose" />
                <StatCard label="Cancelled" value={all.length - active.length} icon={Ban} tone="slate" />
              </div>
              {!started && <p className="mb-3 text-xs text-slate-500">Attendance can be marked once the event starts on {formatDateTime(event.startAt)}.</p>}
              {regs.length ? (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Student</th><th>Student ID</th><th>Registered on</th><th>Status</th><th>Attendance</th><th className="text-right">Actions</th></tr></thead>
                    <tbody>
                      {regs.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <Avatar name={r.user.name} src={r.user.avatar} size={34} />
                              <div><p className="font-medium text-slate-900">{r.user.name}</p><p className="text-xs text-slate-500">{r.user.email}</p></div>
                            </div>
                          </td>
                          <td className="font-mono text-xs">{r.user.studentId ?? "—"}</td>
                          <td className="whitespace-nowrap">{formatDate(r.createdAt)}</td>
                          <td><StatusBadge status={r.status} /></td>
                          <td>{r.status === "REGISTERED" ? <StatusBadge status={r.attendance} label={r.attendance === "PENDING" ? "Not marked" : undefined} /> : "—"}</td>
                          <td>
                            <div className="flex justify-end gap-1.5">
                              {r.status === "REGISTERED" && started && (
                                <>
                                  <QuickAction action={setAttendanceAction} fields={{ registrationId: r.id, attendance: r.attendance === "ATTENDED" ? "PENDING" : "ATTENDED" }} className={cn("btn btn-sm", r.attendance === "ATTENDED" ? "btn-primary" : "btn-outline")}>
                                    <UserCheck className="size-3.5" /> Present
                                  </QuickAction>
                                  <QuickAction action={setAttendanceAction} fields={{ registrationId: r.id, attendance: r.attendance === "ABSENT" ? "PENDING" : "ABSENT" }} className={cn("btn btn-sm", r.attendance === "ABSENT" ? "btn-danger" : "btn-outline")}>
                                    <UserX className="size-3.5" /> Absent
                                  </QuickAction>
                                </>
                              )}
                              {!started && (
                                <QuickAction action={setRegistrationStatusAction} fields={{ registrationId: r.id, status: r.status === "REGISTERED" ? "CANCELLED" : "REGISTERED" }} className={r.status === "REGISTERED" ? "btn btn-sm btn-danger-outline" : "btn btn-sm btn-outline"}>
                                  {r.status === "REGISTERED" ? "Cancel" : "Restore"}
                                </QuickAction>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={Users} title="No registrations found" description={q || status ? "Try clearing the filters." : "Nobody has registered for this event yet."} />
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
