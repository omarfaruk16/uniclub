import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlarmClock, CalendarDays, ChevronLeft, Clock, Lock, MapPin, Ticket, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ACTIVE_REGS, registrationState } from "@/lib/queries";
import { EventRegisterButton } from "@/components/participation";
import { Avatar, ClubLogo, Cover } from "@/components/visuals";
import { Badge, StatusBadge } from "@/components/ui";
import { eventPhase, formatDate, formatDateTime, formatTime } from "@/lib/utils";

type P = { params: Promise<{ id: string }> };

const load = (id: string) =>
  db.event.findUnique({
    where: { id },
    include: {
      club: { include: { rep: { select: { name: true, email: true, avatar: true } } } },
      _count: { select: ACTIVE_REGS },
    },
  });

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const e = await load((await params).id);
  return e ? { title: e.title, description: e.description.slice(0, 160) } : { title: "Event not found" };
}

export default async function EventDetailsPage({ params }: P) {
  const { id } = await params;
  const [event, user] = await Promise.all([load(id), getCurrentUser()]);
  if (!event) notFound();
  const isOwner = !!user && event.club.repId === user.id;
  const publicOk = event.club.status === "APPROVED" && event.status !== "DRAFT";
  if (!publicOk && !(user?.role === "ADMIN" || isOwner)) notFound();

  const [reg, membership] = user
    ? await Promise.all([
        db.registration.findUnique({ where: { userId_eventId: { userId: user.id, eventId: event.id } } }),
        db.membership.findUnique({ where: { userId_clubId: { userId: user.id, clubId: event.clubId } } }),
      ])
    : [null, null];

  const state = registrationState(event, event._count.registrations);
  const phase = eventPhase(event);
  const registered = reg?.status === "REGISTERED";
  const seatsLeft = event.capacity ? Math.max(0, event.capacity - event._count.registrations) : null;
  const fill = event.capacity ? Math.min(100, (event._count.registrations / event.capacity) * 100) : 0;

  const facts = [
    { icon: CalendarDays, label: "Date", value: formatDate(event.startAt) },
    { icon: Clock, label: "Time", value: `${formatTime(event.startAt)} – ${formatTime(event.endAt)}` },
    { icon: MapPin, label: "Venue", value: event.venue },
    { icon: AlarmClock, label: "Registration deadline", value: formatDateTime(event.registrationDeadline) },
  ];

  return (
    <>
      <Cover src={event.image} seed={event.title} category={event.category} className="h-64 sm:h-80" iconSize="size-32">
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/40 to-brand-950/10" />
        <div className="container-page relative flex h-full flex-col justify-between py-5">
          <Link href="/events" className="inline-flex items-center gap-1 self-start rounded-lg bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur hover:bg-white/25">
            <ChevronLeft className="size-4" /> All events
          </Link>
          <div className="pb-2">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge tone="gold">{event.category}</Badge>
              <StatusBadge status={phase} />
              {event.membersOnly && <Badge tone="violet"><Lock className="size-3" /> Members only</Badge>}
            </div>
            <h1 className="max-w-3xl text-3xl font-bold text-white sm:text-4xl">{event.title}</h1>
            <p className="mt-2 text-brand-100">
              Organised by <Link href={`/clubs/${event.club.slug}`} className="font-semibold text-gold-300 hover:underline">{event.club.name}</Link>
            </p>
          </div>
        </div>
      </Cover>

      <div className="container-page mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-2">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3 rounded-2xl bg-brand-50 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-card"><Icon className="size-5" /></div>
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="font-medium text-slate-900">{value}</p>
                </div>
              </div>
            ))}
          </section>
          <section>
            <h2 className="mb-3 text-xl font-bold">About this event</h2>
            <p className="leading-relaxed whitespace-pre-line text-slate-600">{event.description}</p>
          </section>
          <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <ClubLogo name={event.club.name} src={event.club.logo} category={event.club.category} size={56} />
            <div className="flex-1">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Organizer</p>
              <p className="font-display font-semibold text-slate-900">{event.club.name}</p>
              {event.club.rep && (
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <Avatar name={event.club.rep.name} src={event.club.rep.avatar} size={22} /> {event.club.rep.name} ·{" "}
                  <a className="text-brand-600 hover:underline" href={`mailto:${event.club.rep.email}`}>{event.club.rep.email}</a>
                </p>
              )}
            </div>
            <Link href={`/clubs/${event.club.slug}`} className="btn btn-outline">View club</Link>
          </section>
        </div>

        <aside>
          <div className="card sticky top-24 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gold-50 text-gold-600"><Ticket className="size-5" /></div>
              <div>
                <p className="font-display font-semibold text-slate-900">Free registration</p>
                <p className="text-sm text-slate-500">Closes {formatDateTime(event.registrationDeadline)}</p>
              </div>
            </div>
            <div className="mb-5">
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-slate-600"><Users className="size-4" /> {event._count.registrations} registered</span>
                {seatsLeft !== null && <span className="font-semibold text-slate-900">{seatsLeft} of {event.capacity} left</span>}
              </div>
              {event.capacity && (
                <div className="h-2 overflow-hidden rounded-full bg-brand-50">
                  <div className={`h-full rounded-full ${fill > 85 ? "bg-gold-400" : "bg-brand-500"}`} style={{ width: `${fill}%` }} />
                </div>
              )}
            </div>
            <EventRegisterButton
              eventId={event.id}
              state={state}
              registered={registered}
              viewer={user ? { role: user.role } : null}
              size="lg"
              allowCancel
              membersOnlyBlocked={event.membersOnly && membership?.status !== "APPROVED"}
            />
            {event.membersOnly && membership?.status !== "APPROVED" && state === "open" && user?.role !== "ADMIN" && (
              <p className="mt-3 text-center text-xs text-slate-500">
                This event is for members. <Link href={`/clubs/${event.club.slug}`} className="font-semibold text-brand-600 hover:underline">Join {event.club.name}</Link> first.
              </p>
            )}
            {registered && reg && (
              <p className="mt-3 text-center text-xs text-slate-500">You registered on {formatDate(reg.createdAt)}.</p>
            )}
            {isOwner && (
              <Link href={`/club/events/${event.id}/edit`} className="btn btn-outline mt-3 w-full">Edit this event</Link>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
