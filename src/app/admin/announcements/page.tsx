import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { AnnouncementManager } from "@/components/announcement-manager";

export const metadata: Metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage() {
  await requireRole(["ADMIN"]);
  const items = await db.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { club: { select: { name: true } }, author: { select: { name: true } } },
  });
  return (
    <>
      <PageHeader title="Announcements" description="Post university-wide notices and moderate club announcements." />
      <AnnouncementManager
        admin
        audience="every student and representative"
        items={items.map((a) => ({ id: a.id, title: a.title, body: a.body, category: a.category, pinned: a.pinned, createdAt: a.createdAt, scope: a.club ? a.club.name : "University-wide", author: a.author?.name ?? null }))}
      />
    </>
  );
}
