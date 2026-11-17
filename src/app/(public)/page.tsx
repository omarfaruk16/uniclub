import Link from "next/link";
import { ArrowRight, CalendarDays, Megaphone, Sparkles, Users, UserPlus, Search, Ticket } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { ACTIVE_REGS, PUBLIC_EVENT, participation } from "@/lib/queries";
import { ClubCard, EventCard, AnnouncementCard } from "@/components/cards";
import { EmptyState, SectionHeading } from "@/components/ui";
import { ClubLogo } from "@/components/visuals";

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
  const heroClubs = featuredClubs.slice(0, 4);
  const upcomingSorted = upcoming;
  const viewer = user ? { role: user.role } : null;

  return (
    <>
      {/* Hero banner */}
      <section className="relative overflow-hidden bg-brand-800">
        <div className="pattern-dots absolute inset-0 opacity-60" />
        <div className="absolute -top-32 -right-24 size-[28rem] rounded-full bg-brand-600/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 size-[26rem] rounded-full bg-gold-400/20 blur-3xl" />
        <div className="container-page relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-gold-200 ring-1 ring-white/15">
              <Sparkles className="size-3.5" /> {settings.universityName}
            </p>
            <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
              Your campus life,{" "}
              <span className="relative whitespace-nowrap text-gold-400">
                all in one place
                <svg viewBox="0 0 300 12" className="absolute -bottom-2 left-0 w-full" aria-hidden><path d="M2 9c60-6 180-8 296-3" stroke="#F5B942" strokeWidth="4" fill="none" strokeLinecap="round" /></svg>
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-brand-100 sm:text-lg">
              Welcome to {settings.siteName}. Discover student clubs, register for workshops, competitions and cultural nights,
              and never miss an announcement from your university.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/clubs" className="btn btn-gold btn-lg">
                Explore clubs <ArrowRight className="size-4" />
              </Link>
              <Link href="/events" className="btn btn-lg bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/15">
                Browse events
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
              {[
                [clubCount, "Active clubs"],
                [studentCount, "Students"],
                [eventCount, "Upcoming events"],
              ].map(([n, l]) => (
                <div key={l as string}>
                  <dt className="text-xs text-brand-200">{l}</dt>
                  <dd className="font-display text-3xl font-bold text-white">{n}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero visual: next event + club stack */}
          <div className="relative hidden lg:block">
            {upcomingSorted[0] && (
              <Link href={`/events/${upcomingSorted[0].id}`} className="card relative z-10 ml-auto block w-[22rem] rotate-1 p-5 transition hover:rotate-0">
                <p className="text-xs font-semibold tracking-widest text-gold-600 uppercase">Next up</p>
                <p className="mt-2 font-display text-lg font-semibold text-slate-900">{upcomingSorted[0].title}</p>
                <p className="mt-1 text-sm text-slate-500">{upcomingSorted[0].club.name}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-brand-700">
                  <CalendarDays className="size-4" />
                  {new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", weekday: "long", day: "numeric", month: "long" }).format(upcomingSorted[0].startAt)}
                </div>
              </Link>
            )}
            <div className="card relative -mt-4 mr-16 w-[20rem] -rotate-2 p-5">
              <p className="mb-3 text-xs font-semibold tracking-widest text-brand-600 uppercase">Popular clubs</p>
              <ul className="space-y-3">
                {heroClubs.slice(0, 3).map((c) => (
                  <li key={c.id} className="flex items-center gap-3">
                    <ClubLogo name={c.name} src={c.logo} category={c.category} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-500">{c._count.memberships} members</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-brand-100 bg-brand-50">
        <div className="container-page grid gap-6 py-10 sm:grid-cols-3">
          {[
            { icon: Search, title: "Discover", text: "Browse every club and event on campus, filtered by what you love." },
            { icon: UserPlus, title: "Join", text: "Send a membership request in one click and get notified when approved." },
            { icon: Ticket, title: "Take part", text: "Register for events, track your history and get timely updates." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-card"><Icon className="size-5" /></div>
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
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-12 text-center sm:px-12">
            <div className="pattern-dots absolute inset-0" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to get involved?</h2>
              <p className="mx-auto mt-3 max-w-xl text-brand-100">
                Create your free student account with your university email and student ID to join clubs and register for events.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/register" className="btn btn-gold btn-lg">Create account</Link>
                <Link href="/login" className="btn btn-lg bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/15">I already have one</Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
