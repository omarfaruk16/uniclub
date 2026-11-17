import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, CalendarDays, Clock, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ConfirmAction } from "@/components/confirm";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { Cover } from "@/components/visuals";
import { cancelRegistrationAction } from "@/app/actions/student";
import { eventPhase, formatDate, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "My Registrations" };

export default async function MyRegistrationsPage() {
  const user = await requireUser();
  const now = new Date();
  const regs = await db.registration.findMany({
    where: { userId: user.id, event: { endAt: { gte: now } } },
    include: { event: { include: { club: { select: { name: true, slug: true } } } } },
    orderBy: { event: { startAt: "asc" } },
  });

  return (
    <>
      <PageHeader title="My Registrations" description="Upcoming events you've registered for." actions={<Link href="/events" className="btn btn-primary">Find more events</Link>} />
      {regs.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {regs.map(({ event: e, ...r }) => {
            const phase = eventPhase(e);
            const status = e.status === "CANCELLED" ? "CANCELLED" : r.status;
            return (
              <article key={r.id} className="card flex overflow-hidden">
                <Cover src={e.image} seed={e.title} category={e.category} className="hidden w-36 shrink-0 sm:block" iconSize="size-10" />
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={status} label={e.status === "CANCELLED" ? "Event cancelled" : undefined} />
                    {phase === "ONGOING" && <StatusBadge status="ONGOING" />}
                  </div>
                  <Link href={`/events/${e.id}`} className="font-display font-semibold text-slate-900 hover:text-brand-700">{e.title}</Link>
                  <p className="text-sm text-brand-600">{e.club.name}</p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-500">
                    <li className="flex items-center gap-2"><CalendarDays className="size-4 text-brand-500" />{formatDate(e.startAt)}</li>
                    <li className="flex items-center gap-2"><Clock className="size-4 text-brand-500" />{formatTime(e.startAt)} – {formatTime(e.endAt)}</li>
                    <li className="flex items-center gap-2"><MapPin className="size-4 text-brand-500" />{e.venue}</li>
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                    <span>Registered {formatDate(r.createdAt)}</span>
                    {r.status === "REGISTERED" && e.status === "PUBLISHED" && e.startAt > now && (
                      <ConfirmAction
                        action={cancelRegistrationAction}
                        fields={{ eventId: e.id }}
                        label="Cancel"
                        title="Cancel registration?"
                        message={`You'll give up your seat for ${e.title}.`}
                        confirmLabel="Cancel registration"
                      />
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={CalendarCheck} title="No upcoming registrations" description="Events you register for will appear here." action={<Link href="/events" className="btn btn-primary">Browse events</Link>} />
      )}
    </>
  );
}
