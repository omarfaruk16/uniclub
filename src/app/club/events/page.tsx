import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CalendarPlus, Clock, MapPin, Pencil, Users, Trash2, Ban, Send, ClipboardList } from "lucide-react";
import { db } from "@/lib/db";
import { requireRepClub } from "@/lib/rep";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { Cover } from "@/components/visuals";
import { ConfirmAction } from "@/components/confirm";
import { cancelEventAction, deleteEventAction, publishEventAction } from "@/app/actions/club";
import { cn, eventPhase, formatDate, formatTime, strParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage Events" };

const TABS = [
  ["upcoming", "Upcoming"],
  ["drafts", "Drafts"],
  ["past", "Past"],
  ["cancelled", "Cancelled"],
] as const;

export default async function ManageEventsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { club } = await requireRepClub();
  const tab = strParam((await searchParams).tab) || "upcoming";
  const now = new Date();
  const where = {
    clubId: club.id,
    ...(tab === "drafts" ? { status: "DRAFT" } : tab === "cancelled" ? { status: "CANCELLED" } : tab === "past" ? { status: "PUBLISHED", endAt: { lt: now } } : { status: "PUBLISHED", endAt: { gte: now } }),
  };
  const [events, counts] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { startAt: tab === "past" ? "desc" : "asc" },
      include: { _count: { select: { registrations: { where: { status: "REGISTERED" } } } } },
    }),
    Promise.all([
      db.event.count({ where: { clubId: club.id, status: "PUBLISHED", endAt: { gte: now } } }),
      db.event.count({ where: { clubId: club.id, status: "DRAFT" } }),
      db.event.count({ where: { clubId: club.id, status: "PUBLISHED", endAt: { lt: now } } }),
      db.event.count({ where: { clubId: club.id, status: "CANCELLED" } }),
    ]),
  ]);

  return (
    <>
      <PageHeader title="Manage Events" description="Edit, publish, cancel or delete your club's events." actions={<Link href="/club/events/new" className="btn btn-primary"><CalendarPlus className="size-4" /> Create event</Link>} />
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-card sm:inline-flex">
        {TABS.map(([v, l], i) => (
          <Link key={v} href={v === "upcoming" ? "/club/events" : `/club/events?tab=${v}`} className={cn("rounded-lg px-4 py-1.5 text-sm font-medium whitespace-nowrap", tab === v ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-100")}>
            {l} ({counts[i]})
          </Link>
        ))}
      </div>
      {events.length ? (
        <div className="grid gap-5 2xl:grid-cols-2">
          {events.map((e) => {
            const phase = eventPhase(e);
            return (
              <article key={e.id} className="card flex flex-col overflow-hidden sm:flex-row">
                <Cover src={e.image} seed={e.title} category={e.category} className="h-32 sm:h-auto sm:w-40 sm:shrink-0" iconSize="size-10" />
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={phase} />
                    <span className="text-xs text-slate-400">{e.category}</span>
                    {e.membersOnly && <span className="text-xs text-violet-600">Members only</span>}
                  </div>
                  <Link href={`/events/${e.id}`} className="font-display font-semibold text-slate-900 hover:text-brand-700">{e.title}</Link>
                  <ul className="mt-2 grid gap-1 text-sm text-slate-500">
                    <li className="flex items-center gap-2"><CalendarDays className="size-4 text-brand-500" />{formatDate(e.startAt)} <Clock className="ml-2 size-4 text-brand-500" />{formatTime(e.startAt)}</li>
                    <li className="flex items-center gap-2"><MapPin className="size-4 text-brand-500" /><span className="truncate">{e.venue}</span></li>
                    <li className="flex items-center gap-2"><Users className="size-4 text-brand-500" />{e._count.registrations}{e.capacity ? ` / ${e.capacity}` : ""} registered</li>
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {e.status !== "CANCELLED" && phase !== "COMPLETED" && (
                      <Link href={`/club/events/${e.id}/edit`} className="btn btn-sm btn-outline"><Pencil className="size-3.5" /> Edit</Link>
                    )}
                    {e.status === "DRAFT" && (
                      <ConfirmAction action={publishEventAction} fields={{ eventId: e.id }} tone="primary" className="btn btn-sm btn-primary" icon={<Send className="size-3.5" />} label="Publish" title="Publish event?" message="The event will appear on the public site and all club members will be notified." confirmLabel="Publish" />
                    )}
                    {e.status === "PUBLISHED" && (
                      <Link href={`/club/registrations?event=${e.id}`} className="btn btn-sm btn-outline"><ClipboardList className="size-3.5" /> Registrations</Link>
                    )}
                    {e.status === "PUBLISHED" && phase === "UPCOMING" && (
                      <ConfirmAction action={cancelEventAction} fields={{ eventId: e.id }} className="btn btn-sm btn-outline" icon={<Ban className="size-3.5" />} label="Cancel" title="Cancel this event?" message={`${e._count.registrations} registered students will be notified that ${e.title} is cancelled.`} confirmLabel="Cancel event" />
                    )}
                    <ConfirmAction action={deleteEventAction} fields={{ eventId: e.id }} icon={<Trash2 className="size-3.5" />} label="Delete" title="Delete event?" message="This permanently removes the event and all its registrations. This cannot be undone." confirmLabel="Delete event" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={CalendarDays} title={`No ${TABS.find(([v]) => v === tab)?.[1].toLowerCase() ?? ""} events`} action={<Link href="/club/events/new" className="btn btn-primary btn-sm">Create an event</Link>} />
      )}
    </>
  );
}
