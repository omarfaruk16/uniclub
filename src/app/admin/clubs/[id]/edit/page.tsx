import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/ui";
import { ClubForm } from "@/components/club-form";
import { saveClubAdminAction } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Edit Club" };

export default async function EditClubPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["ADMIN"]);
  const club = await db.club.findUnique({ where: { id: (await params).id }, include: { rep: { select: { id: true, name: true, studentId: true } } } });
  if (!club) notFound();
  const candidates = await db.user.findMany({ where: { role: "STUDENT", status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true, studentId: true } });
  const reps = [...(club.rep ? [club.rep] : []), ...candidates].map((u) => ({ id: u.id, label: `${u.name} (${u.studentId ?? "no ID"})` }));
  return (
    <>
      <PageHeader title="Edit Club" description={<span className="inline-flex items-center gap-2">{club.name} <StatusBadge status={club.status} /></span>} />
      <ClubForm action={saveClubAdminAction} defaults={club} reps={reps} cancelHref="/admin/clubs" />
    </>
  );
}
