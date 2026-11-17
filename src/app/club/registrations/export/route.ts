import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

const csv = (v: string) => `"${v.replace(/"/g, '""')}"`;

/** CSV export of an event's registrations, for the club's own representative. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "REP") return new Response("Forbidden", { status: 403 });
  const club = await db.club.findUnique({ where: { repId: user.id } });
  const eventId = new URL(req.url).searchParams.get("event") ?? "";
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!club || !event || event.clubId !== club.id) return new Response("Not found", { status: 404 });

  const regs = await db.registration.findMany({ where: { eventId }, orderBy: { createdAt: "asc" }, include: { user: true } });
  const rows = [
    ["Name", "Student ID", "Email", "Department", "Registered at", "Status", "Attendance"],
    ...regs.map((r) => [r.user.name, r.user.studentId ?? "", r.user.email, r.user.department ?? "", formatDateTime(r.createdAt), r.status, r.attendance]),
  ];
  const body = "﻿" + rows.map((r) => r.map(csv).join(",")).join("\r\n");
  const file = `${event.title.replace(/[^\w]+/g, "-").toLowerCase()}-registrations.csv`;
  return new Response(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${file}"` },
  });
}
