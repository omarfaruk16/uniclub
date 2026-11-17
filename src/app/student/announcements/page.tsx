import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AnnouncementCard } from "@/components/cards";
import { EmptyState, PageHeader } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { pageParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Announcements" };
const PER = 10;

export default async function StudentAnnouncements({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  const page = pageParam((await searchParams).page);
  const clubs = await db.membership.findMany({ where: { userId: user.id, status: "APPROVED" }, select: { clubId: true } });
  const where = { OR: [{ clubId: null }, { clubId: { in: clubs.map((c) => c.clubId) } }] };
  const [total, items] = await Promise.all([
    db.announcement.count({ where }),
    db.announcement.findMany({ where, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], skip: (page - 1) * PER, take: PER, include: { club: { select: { name: true, slug: true } } } }),
  ]);
  return (
    <>
      <PageHeader title="Announcements" description="University notices and updates from the clubs you've joined." />
      {items.length ? (
        <div className="max-w-3xl space-y-4">{items.map((a) => <AnnouncementCard key={a.id} a={a} />)}</div>
      ) : (
        <EmptyState icon={Megaphone} title="No announcements yet" />
      )}
      <Pagination page={page} totalPages={Math.ceil(total / PER)} basePath="/student/announcements" params={{}} />
    </>
  );
}
