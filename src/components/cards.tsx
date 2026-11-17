import Link from "next/link";
import { CalendarDays, Clock, MapPin, Pin, Users } from "lucide-react";
import { ClubLogo, Cover } from "./visuals";
import { Badge, StatusBadge } from "./ui";
import { EventRegisterButton } from "./participation";
import { registrationState } from "@/lib/queries";
import { formatDate, formatDay, formatMonth, formatTime, formatWeekday, timeAgo } from "@/lib/utils";

export function ClubCard({
  club,
  memberCount,
  membership,
}: {
  club: { slug: string; name: string; logo: string | null; cover: string | null; category: string; shortDescription: string };
  memberCount: number;
  membership?: string;
}) {
  return (
    <Link href={`/clubs/${club.slug}`} className="card card-hover group flex flex-col overflow-hidden">
      <Cover src={club.cover} seed={club.name} category={club.category} className="h-28" iconSize="size-12" />
      <div className="flex flex-1 flex-col px-5 pb-5">
        <div className="-mt-8 mb-3 flex items-end justify-between">
          <ClubLogo name={club.name} src={club.logo} category={club.category} size={60} className="shadow-md ring-4 ring-white" />
          {membership === "APPROVED" && <StatusBadge status="APPROVED" label="Member" />}
          {membership === "PENDING" && <StatusBadge status="PENDING" />}
        </div>
        <Badge tone="green" className="mb-2 self-start">{club.category}</Badge>
        <h3 className="font-display text-base font-semibold text-slate-900 group-hover:text-brand-700">{club.name}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{club.shortDescription}</p>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[13px] whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <Users className="size-4" /> {memberCount} members
          </span>
          <span className="font-semibold text-brand-600">Details →</span>
        </div>
      </div>
    </Link>
  );
}

type EventCardData = {
  id: string;
  title: string;
  category: string;
  image: string | null;
  venue: string;
  startAt: Date;
  endAt: Date;
  registrationDeadline: Date;
  capacity: number | null;
  status: string;
  membersOnly: boolean;
  club: { name: string; slug: string };
  _count: { registrations: number };
};

export function EventCard({ event, registered, viewer }: { event: EventCardData; registered: boolean; viewer: { role: string } | null }) {
  const state = registrationState(event, event._count.registrations);
  const seatsLeft = event.capacity ? Math.max(0, event.capacity - event._count.registrations) : null;
  return (
    <article className="card card-hover group flex flex-col overflow-hidden">
      <Link href={`/events/${event.id}`} className="block">
        <Cover src={event.image} seed={event.title} category={event.category} className="aspect-[16/9]">
          <div className="absolute top-3 left-3 flex flex-col items-center rounded-xl bg-white px-2.5 py-1.5 text-center shadow-md">
            <span className="text-[10px] font-semibold text-gold-600 uppercase">{formatMonth(event.startAt)}</span>
            <span className="font-display text-xl leading-none font-bold text-slate-900">{formatDay(event.startAt)}</span>
            <span className="text-[10px] text-slate-500">{formatWeekday(event.startAt)}</span>
          </div>
          <div className="absolute top-3 right-3 flex gap-1.5">
            <Badge tone="gold" className="bg-white/95">{event.category}</Badge>
            {event.membersOnly && <Badge tone="violet" className="bg-white/95">Members</Badge>}
          </div>
        </Cover>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/clubs/${event.club.slug}`} className="text-xs font-semibold text-brand-600 hover:underline">
          {event.club.name}
        </Link>
        <Link href={`/events/${event.id}`}>
          <h3 className="mt-1 line-clamp-2 font-display text-base font-semibold text-slate-900 group-hover:text-brand-700">{event.title}</h3>
        </Link>
        <ul className="mt-3 flex-1 space-y-1.5 text-sm text-slate-500">
          <li className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0 text-brand-500" />{formatDate(event.startAt)}</li>
          <li className="flex items-center gap-2"><Clock className="size-4 shrink-0 text-brand-500" />{formatTime(event.startAt)} – {formatTime(event.endAt)}</li>
          <li className="flex items-center gap-2"><MapPin className="size-4 shrink-0 text-brand-500" /><span className="truncate">{event.venue}</span></li>
        </ul>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-500">
            {state === "open" && seatsLeft !== null ? `${seatsLeft} seats left` : `${event._count.registrations} registered`}
          </span>
          <EventRegisterButton eventId={event.id} state={state} registered={registered} viewer={viewer} />
        </div>
      </div>
    </article>
  );
}

export function AnnouncementCard({
  a,
  compact = false,
}: {
  a: { id: string; title: string; body: string; category: string; pinned: boolean; createdAt: Date; club: { name: string; slug: string } | null };
  compact?: boolean;
}) {
  const tone = a.category === "Urgent" ? "red" : a.category === "Academic" ? "blue" : a.category === "Event" ? "gold" : a.category === "Club" ? "violet" : "green";
  return (
    <article className={`card relative p-5 ${a.pinned ? "ring-1 ring-gold-300" : ""}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone={tone}>{a.category}</Badge>
        {a.club ? (
          <Link href={`/clubs/${a.club.slug}`} className="text-xs font-medium text-brand-600 hover:underline">{a.club.name}</Link>
        ) : (
          <span className="text-xs font-medium text-slate-500">University notice</span>
        )}
        {a.pinned && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-gold-600"><Pin className="size-3.5" /> Pinned</span>
        )}
      </div>
      <h3 className="font-display text-base font-semibold text-slate-900">{a.title}</h3>
      <p className={`mt-1.5 text-sm text-slate-500 ${compact ? "line-clamp-2" : "whitespace-pre-line"}`}>{a.body}</p>
      <p className="mt-3 text-xs text-slate-400" title={formatDate(a.createdAt)}>{formatDate(a.createdAt)} · {timeAgo(a.createdAt)}</p>
    </article>
  );
}
