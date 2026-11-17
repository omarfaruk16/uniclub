import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Star, Trash2, Ban, Send } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { ConfirmAction, QuickAction } from "@/components/confirm";
import { Filters } from "@/components/filters";
import { Pagination } from "@/components/pagination";
import { deleteEventAdminAction, setEventStatusAdminAction, toggleEventFeaturedAction } from "@/app/actions/admin";
import { TABLE_PAGE_SIZE } from "@/lib/constants";
import { cn, eventPhase, formatDate, formatTime, pageParam, strParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Event Management" };

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole(["ADMIN"]);
  const sp = await searchParams;
  const q = strParam(sp.q);
  const phase = strParam(sp.phase);
  const club = strParam(sp.club);
  const page = pageParam(sp.page);
  const now = new Date();
  const phaseWhere =
    phase === "upcoming" ? { status: "PUBLISHED", endAt: { gte: now } }
    : phase === "completed" ? { status: "PUBLISHED", endAt: { lt: now } }
    : phase === "draft" ? { status: "DRAFT" }
    : phase === "cancelled" ? { status: "CANCELLED" }
    : {};
  const where = {
    ...phaseWhere,
    ...(club ? { clubId: club } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { venue: { contains: q } }] } : {}),
  };
  const [total, events, clubs] = await Promise.all([
    db.event.count({ where }),
    db.event.findMany({
      where,
      orderBy: { startAt: "desc" },
      skip: (page - 1) * TABLE_PAGE_SIZE,
      take: TABLE_PAGE_SIZE,
      include: { club: { select: { name: true, slug: true } }, _count: { select: { registrations: { where: { status: "REGISTERED" } } } } },
    }),
    db.club.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader title="Event Management" description="Every event across all clubs. Feature, cancel or remove events." />
      <Filters
        placeholder="Search events or venues…"
        selects={[
          { name: "phase", label: "All statuses", options: [{ value: "upcoming", label: "Upcoming" }, { value: "completed", label: "Completed" }, { value: "draft", label: "Drafts" }, { value: "cancelled", label: "Cancelled" }] },
          { name: "club", label: "All clubs", options: clubs.map((c) => ({ value: c.id, label: c.name })) },
        ]}
      />
      {events.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Event</th><th>Organizing club</th><th>Date</th><th>Registrations</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {events.map((e) => {
                const p = eventPhase(e);
                return (
                  <tr key={e.id}>
                    <td>
                      <Link href={`/events/${e.id}`} className="font-medium text-slate-900 hover:text-brand-700">{e.title}</Link>
                      <p className="text-xs text-slate-500">{e.category} · {e.venue}</p>
                    </td>
                    <td><Link href={`/clubs/${e.club.slug}`} className="text-brand-600 hover:underline">{e.club.name}</Link></td>
                    <td className="whitespace-nowrap">{formatDate(e.startAt)}<p className="text-xs text-slate-400">{formatTime(e.startAt)}</p></td>
                    <td>{e._count.registrations}{e.capacity ? <span className="text-slate-400"> / {e.capacity}</span> : ""}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={p} />
                        {e.featured && <Star className="size-4 fill-gold-400 text-gold-400" aria-label="Featured" />}
                      </div>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        {e.status === "PUBLISHED" && p !== "COMPLETED" && (
                          <QuickAction action={toggleEventFeaturedAction} fields={{ eventId: e.id }} title={e.featured ? "Un-feature" : "Feature on home page"} className={cn("btn btn-sm", e.featured ? "bg-gold-50 text-gold-700 ring-1 ring-gold-200" : "btn-outline")}>
                            <Star className={cn("size-3.5", e.featured && "fill-gold-400")} />
                          </QuickAction>
                        )}
                        {e.status === "PUBLISHED" && p === "UPCOMING" && (
                          <ConfirmAction action={setEventStatusAdminAction} fields={{ eventId: e.id, status: "CANCELLED" }} className="btn btn-sm btn-outline" icon={<Ban className="size-3.5" />} label="Cancel" title={`Cancel ${e.title}?`} message="Registered students and the club representative will be notified." confirmLabel="Cancel event" />
                        )}
                        {e.status === "CANCELLED" && e.startAt > now && (
                          <ConfirmAction action={setEventStatusAdminAction} fields={{ eventId: e.id, status: "PUBLISHED" }} tone="primary" className="btn btn-sm btn-outline" icon={<Send className="size-3.5" />} label="Restore" title="Restore this event?" message="The event will be published again." confirmLabel="Restore" />
                        )}
                        <ConfirmAction action={deleteEventAdminAction} fields={{ eventId: e.id }} icon={<Trash2 className="size-3.5" />} title={`Delete ${e.title}?`} message="This permanently deletes the event and its registrations." confirmLabel="Delete" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={CalendarDays} title="No events found" />
      )}
      <Pagination page={page} totalPages={Math.ceil(total / TABLE_PAGE_SIZE)} basePath="/admin/events" params={{ q, phase, club }} />
    </>
  );
}
