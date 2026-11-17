import type { Metadata } from "next";
import { Users, Trash2, Ban, RotateCcw } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { Avatar } from "@/components/visuals";
import { ConfirmAction } from "@/components/confirm";
import { Filters } from "@/components/filters";
import { Pagination } from "@/components/pagination";
import { AddUserButton, RoleSelect } from "@/components/admin-widgets";
import { deleteUserAction, toggleUserStatusAction } from "@/app/actions/admin";
import { TABLE_PAGE_SIZE } from "@/lib/constants";
import { formatDate, pageParam, strParam } from "@/lib/utils";

export const metadata: Metadata = { title: "User Management" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireRole(["ADMIN"]);
  const sp = await searchParams;
  const q = strParam(sp.q);
  const role = strParam(sp.role);
  const status = strParam(sp.status);
  const page = pageParam(sp.page);
  const where = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { studentId: { contains: q } }] } : {}),
  };
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * TABLE_PAGE_SIZE,
      take: TABLE_PAGE_SIZE,
      include: { managedClub: { select: { name: true } }, _count: { select: { memberships: { where: { status: "APPROVED" } }, registrations: { where: { status: "REGISTERED" } } } } },
    }),
  ]);

  return (
    <>
      <PageHeader title="User Management" description={`${total} ${total === 1 ? "account" : "accounts"} on the platform.`} actions={<AddUserButton />} />
      <Filters
        placeholder="Search by name, email or student ID…"
        selects={[
          { name: "role", label: "All roles", options: [{ value: "STUDENT", label: "Students" }, { value: "REP", label: "Club representatives" }, { value: "ADMIN", label: "Administrators" }] },
          { name: "status", label: "All statuses", options: [{ value: "ACTIVE", label: "Active" }, { value: "SUSPENDED", label: "Suspended" }] },
        ]}
      />
      {users.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>User</th><th>Student ID</th><th>Role</th><th>Activity</th><th>Status</th><th>Joined</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} src={u.avatar} size={36} />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{u.name}{u.id === me.id && <span className="ml-1 text-xs text-slate-400">(you)</span>}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{u.studentId ?? "—"}</td>
                  <td>
                    <div className="space-y-1">
                      <StatusBadge status={u.role} />
                      {u.managedClub && <p className="text-xs text-slate-500">{u.managedClub.name}</p>}
                    </div>
                  </td>
                  <td className="text-xs text-slate-500">{u._count.memberships} clubs · {u._count.registrations} events</td>
                  <td><StatusBadge status={u.status} /></td>
                  <td className="whitespace-nowrap">{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <RoleSelect userId={u.id} role={u.role} disabled={u.id === me.id} />
                      {u.id !== me.id && (
                        <>
                          <ConfirmAction
                            action={toggleUserStatusAction}
                            fields={{ userId: u.id }}
                            className="btn btn-sm btn-outline"
                            tone={u.status === "ACTIVE" ? "danger" : "primary"}
                            icon={u.status === "ACTIVE" ? <Ban className="size-3.5" /> : <RotateCcw className="size-3.5" />}
                            title={u.status === "ACTIVE" ? `Suspend ${u.name}?` : `Reactivate ${u.name}?`}
                            message={u.status === "ACTIVE" ? "They will be signed out and unable to log in until reactivated." : "They will be able to log in again."}
                            confirmLabel={u.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                          />
                          <ConfirmAction action={deleteUserAction} fields={{ userId: u.id }} icon={<Trash2 className="size-3.5" />} title={`Delete ${u.name}?`} message="This permanently deletes the account with its memberships, registrations and notifications. This cannot be undone." confirmLabel="Delete user" />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={Users} title="No users found" />
      )}
      <Pagination page={page} totalPages={Math.ceil(total / TABLE_PAGE_SIZE)} basePath="/admin/users" params={{ q, role, status }} />
    </>
  );
}
