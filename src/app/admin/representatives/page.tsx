import type { Metadata } from "next";
import Link from "next/link";
import { Shield, UserMinus } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { Avatar, ClubLogo } from "@/components/visuals";
import { ConfirmAction } from "@/components/confirm";
import { AssignRepForm } from "./assign-form";
import { unassignRepAction } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Representative Management" };

export default async function RepresentativesPage() {
  await requireRole(["ADMIN"]);
  const [clubs, candidates] = await Promise.all([
    db.club.findMany({
      where: { status: { in: ["APPROVED", "SUSPENDED"] } },
      orderBy: { name: "asc" },
      include: { rep: true, _count: { select: { memberships: { where: { status: "APPROVED" } } } } },
    }),
    db.user.findMany({ where: { role: { in: ["STUDENT", "REP"] }, status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true, studentId: true, role: true } }),
  ]);
  const withRep = clubs.filter((c) => c.rep);
  const without = clubs.filter((c) => !c.rep);

  return (
    <>
      <PageHeader title="Representative Management" description="Each club has one representative who manages it from the club dashboard." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {withRep.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Representative</th><th>Student ID</th><th>Assigned club</th><th>Members</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {withRep.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={c.rep!.name} src={c.rep!.avatar} size={36} />
                          <div><p className="font-medium text-slate-900">{c.rep!.name}</p><p className="text-xs text-slate-500">{c.rep!.email}</p></div>
                        </div>
                      </td>
                      <td className="font-mono text-xs">{c.rep!.studentId ?? "—"}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <ClubLogo name={c.name} src={c.logo} category={c.category} size={30} />
                          <Link href={`/clubs/${c.slug}`} className="font-medium text-brand-700 hover:underline">{c.name}</Link>
                          {c.status !== "APPROVED" && <StatusBadge status={c.status} />}
                        </div>
                      </td>
                      <td>{c._count.memberships}</td>
                      <td className="text-right">
                        <ConfirmAction action={unassignRepAction} fields={{ clubId: c.id }} icon={<UserMinus className="size-3.5" />} label="Unassign" title="Remove representative?" message={`${c.rep!.name} will go back to a student account and lose access to the ${c.name} dashboard.`} confirmLabel="Unassign" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Shield} title="No representatives assigned yet" />
          )}
          {without.length > 0 && (
            <Card title={`Clubs without a representative (${without.length})`}>
              <ul className="flex flex-wrap gap-2">
                {without.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 rounded-xl bg-gold-50 px-3 py-1.5 text-sm text-gold-700 ring-1 ring-gold-200">
                    <ClubLogo name={c.name} src={c.logo} category={c.category} size={22} /> {c.name}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        <Card title="Assign a representative" className="h-fit">
          <AssignRepForm
            clubs={clubs.map((c) => ({ id: c.id, label: c.rep ? `${c.name} (currently ${c.rep.name})` : c.name }))}
            users={candidates.map((u) => ({ id: u.id, label: `${u.name}${u.studentId ? ` · ${u.studentId}` : ""}${u.role === "REP" ? " (rep)" : ""}` }))}
          />
        </Card>
      </div>
    </>
  );
}
