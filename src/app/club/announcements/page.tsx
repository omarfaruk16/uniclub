import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRepClub } from "@/lib/rep";
import { PageHeader } from "@/components/ui";
import { AnnouncementManager } from "@/components/announcement-manager";

export const metadata: Metadata = { title: "Club Announcements" };

export default async function ClubAnnouncementsPage() {
  const { club } = await requireRepClub();
  const items = await db.announcement.findMany({ where: { clubId: club.id }, orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } });
  return (
    <>
      <PageHeader title="Announcements" description={`Notices from ${club.name}, shown on the public announcements page and sent to members.`} />
      <AnnouncementManager
        audience="your club members"
        items={items.map((a) => ({ id: a.id, title: a.title, body: a.body, category: a.category, pinned: a.pinned, createdAt: a.createdAt, scope: club.name, author: a.author?.name ?? null }))}
      />
    </>
  );
}
