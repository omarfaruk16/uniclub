import type { Metadata } from "next";
import { AdSlot } from "@/components/ad-slot";
import { CalendarDays } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { ACTIVE_REGS, PUBLIC_EVENT, participation } from "@/lib/queries";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { pageParam, strParam, toOptions } from "@/lib/utils";
import { EventCard } from "@/components/cards";
import { Filters } from "@/components/filters";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/ui";
import { PageBanner } from "@/components/page-banner";

export const metadata: Metadata = { title: "Explore Events" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function EventsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = strParam(sp.q);
  const category = strParam(sp.category);
  const club = strParam(sp.club);
  const when = strParam(sp.when) === "past" ? "past" : "upcoming";
  const page = pageParam(sp.page);
  const now = new Date();

  const [user, settings, clubs] = await Promise.all([
    getCurrentUser(),
    getSettings(),
    db.club.findMany({ where: { status: "APPROVED" }, orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);
  const perPage = Number(settings.eventsPerPage) || 9;

  const where = {
    ...PUBLIC_EVENT,
    ...(when === "past" ? { endAt: { lt: now } } : { endAt: { gte: now } }),
    ...(category ? { category } : {}),
    ...(club ? { club: { status: "APPROVED", slug: club } } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }, { venue: { contains: q } }, { club: { name: { contains: q } } }] } : {}),
  };
  const [total, events, mine] = await Promise.all([
    db.event.count({ where }),
    db.event.findMany({
      where,
      orderBy: { startAt: when === "past" ? "desc" : "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { club: { select: { name: true, slug: true } }, _count: { select: ACTIVE_REGS } },
    }),
    participation(user?.id),
  ]);

  return (
    <>
      <PageBanner title="Explore Events" text="Workshops, competitions, seminars and cultural nights from every club on campus." />
      <div className="container-page pt-10">
        <AdSlot placement="EVENTS" className="mb-6" />
        <Filters
          placeholder="Search events, venues or clubs…"
          tabs={{ name: "when", options: [{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past events" }] }}
          selects={[
            { name: "category", label: "All categories", options: toOptions(EVENT_CATEGORIES) },
            { name: "club", label: "All clubs", options: clubs.map((c) => ({ value: c.slug, label: c.name })) },
          ]}
        />
        <p className="mb-4 text-sm text-slate-500">{total} {when} {total === 1 ? "event" : "events"}</p>
        {events.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} registered={mine.registrations.has(e.id)} viewer={user ? { role: user.role } : null} />
            ))}
          </div>
        ) : (
          <EmptyState icon={CalendarDays} title={`No ${when} events found`} description="Try another search or filter." />
        )}
        <Pagination page={page} totalPages={Math.ceil(total / perPage)} basePath="/events" params={{ q, category, club, when: when === "past" ? "past" : "" }} />
      </div>
    </>
  );
}
