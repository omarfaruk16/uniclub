import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ClubForm } from "@/components/club-form";
import { saveClubAdminAction } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Add Club" };

export default async function NewClubPage() {
  await requireRole(["ADMIN"]);
  const candidates = await db.user.findMany({ where: { role: "STUDENT", status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true, studentId: true } });
  return (
    <>
      <PageHeader title="Add Club" description="Clubs created by an administrator are approved immediately." />
      <ClubForm action={saveClubAdminAction} reps={candidates.map((u) => ({ id: u.id, label: `${u.name} (${u.studentId ?? "no ID"})` }))} cancelHref="/admin/clubs" submitLabel="Create club" />
    </>
  );
}
