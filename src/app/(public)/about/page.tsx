import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CalendarCheck, LayoutDashboard, ShieldCheck, Users, Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { PageBanner } from "@/components/page-banner";

export const metadata: Metadata = { title: "About Us" };

export default async function AboutPage() {
  const [settings, clubs, students, events, regs] = await Promise.all([
    getSettings(),
    db.club.count({ where: { status: "APPROVED" } }),
    db.user.count({ where: { role: { in: ["STUDENT", "REP"] } } }),
    db.event.count({ where: { status: "PUBLISHED" } }),
    db.registration.count({ where: { status: "REGISTERED" } }),
  ]);

  const roles = [
    { icon: Users, title: "Students", text: "Discover clubs, request membership, register for events, follow announcements and keep a record of every event attended." },
    { icon: Building2, title: "Club representatives", text: "Maintain the club profile, approve members, publish events, manage registrations and attendance, and post notices." },
    { icon: ShieldCheck, title: "Administrators", text: "Approve clubs, manage users and representatives, oversee all events and announcements, and track platform analytics." },
  ];
  const features = [
    { icon: LayoutDashboard, title: "Role-based dashboards", text: "Each user sees exactly the tools for their role." },
    { icon: CalendarCheck, title: "Event registration", text: "Capacity limits, deadlines and members-only events." },
    { icon: Bell, title: "In-app notifications", text: "Updates on memberships, events and announcements." },
  ];

  return (
    <>
      <PageBanner title={`About ${settings.siteName}`} text={`The centralised club and event platform for ${settings.universityName}.`} />
      <div className="container-page space-y-16 pt-12">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="prose-body">
            <h2 className="text-2xl font-bold text-slate-900">Why we built it</h2>
            <p>
              Club information used to be scattered across notice boards, social media pages and group chats. Students missed events, clubs
              struggled to track registrations and the Student Affairs Office had no single view of campus activity.
            </p>
            <p>
              {settings.siteName} brings everything together: a public website where anyone can browse clubs, events and announcements, and
              dedicated dashboards for students, club representatives and administrators built on one shared account system.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            {[
              [clubs, "Active clubs"],
              [students, "Registered students"],
              [events, "Events published"],
              [regs, "Event registrations"],
            ].map(([n, l]) => (
              <div key={l as string} className="rounded-2xl bg-brand-50 p-6">
                <dd className="font-display text-3xl font-bold text-brand-700">{n}</dd>
                <dt className="mt-1 text-sm text-slate-600">{l}</dt>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-bold">Who it&apos;s for</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {roles.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-6">
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-600 text-white"><Icon className="size-6" /></div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 pattern-grid rounded-3xl bg-ink p-8 sm:p-10 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <Icon className="mb-3 size-7 text-gold-400" />
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm text-white/60">{text}</p>
            </div>
          ))}
        </section>

        <section className="text-center">
          <h2 className="text-2xl font-bold">Questions or want to start a club?</h2>
          <p className="mt-2 text-slate-500">
            Write to <a href={`mailto:${settings.contactEmail}`} className="font-semibold text-brand-600 hover:underline">{settings.contactEmail}</a> or visit the {settings.address}.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/clubs" className="btn btn-primary">Explore clubs</Link>
            <Link href="/register" className="btn btn-outline">Create an account</Link>
          </div>
        </section>
      </div>
    </>
  );
}
