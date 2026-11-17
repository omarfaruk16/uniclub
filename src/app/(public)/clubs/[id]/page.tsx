import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, ChevronLeft, Mail, Megaphone, Users, CalendarCheck, Award } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { flag, getSettings } from "@/lib/settings";
import { ACTIVE_REGS, participation } from "@/lib/queries";
import { AnnouncementCard, EventCard } from "@/components/cards";
import { JoinClubButton } from "@/components/participation";
import { Avatar, ClubLogo, Cover } from "@/components/visuals";
import { Badge, EmptyState, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

type P = { params: Promise<{ id: string }> };

async function load(slug: string) {
  return db.club.findUnique({
    where: { slug },
    include: {
      rep: { select: { name: true, email: true, avatar: true, department: true } },
      _count: { select: { memberships: { where: { status: "APPROVED" } }, events: { where: { status: "PUBLISHED" } } } },
    },
  });
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const club = await load((await params).id);
  return club ? { title: club.name, description: club.shortDescription } : { title: "Club not found" };
}

export default async function ClubDetailsPage({ params }: P) {
  const { id } = await params;
  const [club, user, settings] = await Promise.all([load(id), getCurrentUser(), getSettings()]);
  if (!club) notFound();
  const isRep = !!user && club.repId === user.id;
  if (club.status !== "APPROVED" && !(user?.role === "ADMIN" || isRep)) notFound();

  const now = new Date();
  const [upcoming, past, announcements, members, mine] = await Promise.all([
    db.event.findMany({
      where: { clubId: club.id, status: "PUBLISHED", startAt: { gte: now } },
      orderBy: { startAt: "asc" },
      include: { club: { select: { name: true, slug: true } }, _count: { select: ACTIVE_REGS } },
    }),
    db.event.findMany({ where: { clubId: club.id, status: "PUBLISHED", startAt: { lt: now } }, orderBy: { startAt: "desc" }, take: 4 }),
    db.announcement.findMany({ where: { clubId: club.id }, orderBy: { createdAt: "desc" }, take: 3, include: { club: { select: { name: true, slug: true } } } }),
    db.membership.findMany({ where: { clubId: club.id, status: "APPROVED" }, take: 8, orderBy: { createdAt: "asc" }, include: { user: { select: { name: true, avatar: true } } } }),
    participation(user?.id),
  ]);
  const objectives = club.objectives.split("\n").map((o) => o.trim()).filter(Boolean);
  const viewer = user ? { role: user.role } : null;

  return (
    <>
      <Cover src={club.cover} seed={club.name} category={club.category} className="h-56 sm:h-72" iconSize="size-28">
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/30 to-transparent" />
        <div className="container-page relative flex h-full flex-col justify-between py-5">
          <Link href="/clubs" className="inline-flex items-center gap-1 self-start rounded-lg bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur hover:bg-white/25">
            <ChevronLeft className="size-4" /> All clubs
          </Link>
        </div>
      </Cover>

      <div className="container-page">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <ClubLogo name={club.name} src={club.logo} category={club.category} size={120} className="-mt-16 shadow-lift ring-4 ring-white" />
          <div className="flex-1 sm:pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="green">{club.category}</Badge>
              {club.status !== "APPROVED" && <StatusBadge status={club.status} />}
            </div>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{club.name}</h1>
            <p className="mt-1 text-slate-500">{club.shortDescription}</p>
          </div>
          {user?.role !== "ADMIN" && (
          <div className="self-start rounded-2xl bg-brand-700 p-2.5 shadow-card sm:mt-4">
            <JoinClubButton
              clubId={club.id}
              clubName={club.name}
              status={mine.memberships.get(club.id)}
              viewer={viewer}
              isRep={isRep}
              approvalRequired={flag(settings.membershipApproval)}
              nextPath={`/clubs/${club.slug}`}
            />
          </div>
          )}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10">
            <section>
              <h2 className="mb-3 text-xl font-bold">About the club</h2>
              <p className="leading-relaxed whitespace-pre-line text-slate-600">{club.description}</p>
            </section>

            {objectives.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold">Our objectives</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {objectives.map((o) => (
                    <li key={o} className="flex gap-3 rounded-xl bg-brand-50 p-4 text-sm text-slate-700">
                      <CheckCircle2 className="size-5 shrink-0 text-brand-600" /> {o}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="mb-4 text-xl font-bold">Upcoming events</h2>
              {upcoming.length ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {upcoming.map((e) => (
                    <EventCard key={e.id} event={e} registered={mine.registrations.has(e.id)} viewer={viewer} />
                  ))}
                </div>
              ) : (
                <EmptyState icon={CalendarDays} title="No upcoming events" description="This club hasn't scheduled anything yet. Join to be notified when it does." />
              )}
            </section>

            {announcements.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold">Club notices</h2>
                <div className="grid gap-4">
                  {announcements.map((a) => <AnnouncementCard key={a.id} a={a} compact />)}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <div className="card grid grid-cols-3 divide-x divide-slate-100 py-4 text-center">
              {[
                [Users, club._count.memberships, "Members"],
                [CalendarCheck, club._count.events, "Events"],
                [Award, club.foundedYear ?? "—", "Founded"],
              ].map(([Icon, n, l]) => {
                const I = Icon as typeof Users;
                return (
                  <div key={l as string}>
                    <I className="mx-auto mb-1 size-5 text-brand-500" />
                    <p className="font-display text-lg font-bold text-slate-900">{n as React.ReactNode}</p>
                    <p className="text-xs text-slate-500">{l as string}</p>
                  </div>
                );
              })}
            </div>

            <div className="card p-5">
              <h3 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">Club representative</h3>
              {club.rep ? (
                <div className="flex items-center gap-3">
                  <Avatar name={club.rep.name} src={club.rep.avatar} size={52} />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{club.rep.name}</p>
                    <p className="text-sm text-slate-500">President{club.rep.department ? ` · ${club.rep.department}` : ""}</p>
                    <a href={`mailto:${club.rep.email}`} className="mt-1 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
                      <Mail className="size-3.5" /> {club.rep.email}
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No representative assigned yet.</p>
              )}
              {club.email && (
                <a href={`mailto:${club.email}`} className="btn btn-outline mt-5 w-full">
                  <Mail className="size-4" /> Contact the club
                </a>
              )}
            </div>

            {members.length > 0 && (
              <div className="card p-5">
                <h3 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">Members</h3>
                <div className="flex -space-x-2">
                  {members.map((m) => <Avatar key={m.id} name={m.user.name} src={m.user.avatar} size={38} />)}
                  {club._count.memberships > members.length && (
                    <span className="flex size-[38px] items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 ring-2 ring-white">
                      +{club._count.memberships - members.length}
                    </span>
                  )}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div className="card p-5">
                <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">Past events</h3>
                <ul className="space-y-3">
                  {past.map((e) => (
                    <li key={e.id}>
                      <Link href={`/events/${e.id}`} className="block text-sm font-medium text-slate-800 hover:text-brand-700">{e.title}</Link>
                      <p className="text-xs text-slate-500">{formatDate(e.startAt)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!user && (
              <div className="rounded-2xl bg-gold-50 p-5 text-sm text-gold-700 ring-1 ring-gold-200">
                <Megaphone className="mb-2 size-5" />
                <Link href={`/login?next=/clubs/${club.slug}`} className="font-semibold underline">Sign in</Link> to join {club.name} and get notified about its events.
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
