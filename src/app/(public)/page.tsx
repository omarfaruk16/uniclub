import Link from "next/link";
import { ArrowRight, CalendarDays, Megaphone, Users, UserPlus, Search, Ticket } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { ACTIVE_REGS, PUBLIC_EVENT, participation } from "@/lib/queries";
import { ClubCard, EventCard, AnnouncementCard } from "@/components/cards";
import { EmptyState, SectionHeading } from "@/components/ui";
import { CampusScene } from "@/components/campus-scene";
import { NextEventCard, RegisteredCard, sceneData } from "@/components/scene-cards";

export default async function HomePage() {
  const now = new Date();
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  const [featuredClubs, upcoming, announcements, clubCount, studentCount, eventCount, mine] = await Promise.all([
    db.club.findMany({
      where: { status: "APPROVED" },
      orderBy: [{ featured: "desc" }, { memberships: { _count: "desc" } }],
      take: 4,
      include: { _count: { select: { memberships: { where: { status: "APPROVED" } } } } },
    }),
    db.event.findMany({
      where: { ...PUBLIC_EVENT, startAt: { gte: now } },
      orderBy: { startAt: "asc" },
      take: 6,
      include: { club: { select: { name: true, slug: true } }, _count: { select: ACTIVE_REGS } },
    }),
    db.announcement.findMany({
      where: { OR: [{ clubId: null }, { club: { status: "APPROVED" } }] },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 3,
      include: { club: { select: { name: true, slug: true } } },
    }),
    db.club.count({ where: { status: "APPROVED" } }),
    db.user.count({ where: { role: { in: ["STUDENT", "REP"] }, status: "ACTIVE" } }),
    db.event.count({ where: { ...PUBLIC_EVENT, startAt: { gte: now } } }),
    participation(user?.id),
  ]);
  const scene = await sceneData();
  const upcomingSorted = upcoming;
  const viewer = user ? { role: user.role } : null;

  return (
    <>
      {/* Hero */}
      <section className="container-page pt-6 sm:pt-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
          <div className="order-2 lg:order-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <span className="size-1.5 rounded-full bg-brand-500" /> {settings.universityName}
            </p>
            <h1 className="mt-5 text-[2.5rem] leading-[1.05] font-extrabold tracking-tight text-ink sm:text-[3.4rem] lg:text-[3.9rem]">
              Every club.<br />Every event.<br /><span className="text-brand-600">One campus.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-500 sm:text-lg">
              Discover student clubs, register for workshops, competitions and cultural nights, and never miss a notice from your university.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/clubs" className="btn btn-lg btn-dark rounded-full">
                Explore clubs <ArrowRight className="size-4" />
              </Link>
              <Link href="/events" className="btn btn-lg btn-outline rounded-full">Browse events</Link>
            </div>
            <dl className="mt-9 grid max-w-md grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-white">
              {[
                [clubCount, "Active clubs"],
                [studentCount, "Students"],
                [eventCount, "Upcoming events"],
              ].map(([n, l]) => (
                <div key={l as string} className="px-4 py-3">
                  <dd className="font-display text-2xl font-bold text-ink">{n}</dd>
                  <dt className="text-xs text-slate-500">{l}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative order-1 h-[300px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#EEF7F0] via-[#E1EFE5] to-[#CFE5D6] sm:h-[420px] lg:order-2 lg:h-[540px]">
            <CampusScene className="absolute inset-0 size-full overflow-visible" />
            <NextEventCard data={scene} className="absolute top-5 right-5 hidden animate-float sm:block" />
            <RegisteredCard data={scene} className="absolute top-[42%] right-4 hidden animate-float [animation-delay:1.5s] lg:flex" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page mt-12 sm:mt-16">
        <div className="grid gap-4 rounded-3xl border border-line bg-canvas p-4 sm:grid-cols-3 sm:p-6">
          {[
            { icon: Search, title: "Discover", text: "Browse every club and event on campus, filtered by what you love." },
            { icon: UserPlus, title: "Join", text: "Send a membership request in one click and get notified when approved." },
            { icon: Ticket, title: "Take part", text: "Register for events, track your history and get timely updates." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl bg-white p-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink text-gold-400"><Icon className="size-5" /></div>
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-0.5 text-sm text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="container-page space-y-20 pt-16">
        <section>
          <SectionHeading eyebrow="Featured clubs" title="Find your people" description="Communities run by students, for students." href="/clubs" linkLabel="All clubs" />
          {featuredClubs.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredClubs.map((c) => (
                <ClubCard key={c.id} club={c} memberCount={c._count.memberships} membership={mine.memberships.get(c.id)} />
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="No clubs yet" description="Approved clubs will appear here." />
          )}
        </section>

        <section>
          <SectionHeading eyebrow="Upcoming events" title="What's happening on campus" href="/events" linkLabel="All events" />
          {upcomingSorted.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingSorted.map((e) => (
                <EventCard key={e.id} event={e} registered={mine.registrations.has(e.id)} viewer={viewer} />
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarDays} title="No upcoming events" description="Check back soon for new events." />
          )}
        </section>

        <section>
          <SectionHeading eyebrow="Latest announcements" title="News & notices" href="/announcements" linkLabel="All announcements" />
          {announcements.length ? (
            <div className="grid gap-6 md:grid-cols-3">
              {announcements.map((a) => (
                <AnnouncementCard key={a.id} a={a} compact />
              ))}
            </div>
          ) : (
            <EmptyState icon={Megaphone} title="No announcements yet" />
          )}
        </section>

        {!user && (
          <section className="relative overflow-hidden rounded-3xl bg-ink px-6 py-12 text-center sm:px-12">
            <div className="pattern-grid absolute inset-0" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to get involved?</h2>
              <p className="mx-auto mt-3 max-w-xl text-white/60">
                Create your free student account with your university email and student ID to join clubs and register for events.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/register" className="btn btn-gold btn-lg rounded-full">Create account</Link>
                <Link href="/login" className="btn btn-lg rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15">I already have one</Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
