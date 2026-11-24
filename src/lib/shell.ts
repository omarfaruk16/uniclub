import "server-only";
import { db } from "./db";

/** Data every dashboard page needs: the notification dropdown plus the sidebar's count badges. */
export async function shellData(userId: string, area: "student" | "club" | "admin", clubId?: string | null) {
  const [notifications, unread, pendingMembers, pendingClubs, upcomingRegs] = await Promise.all([
    db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.notification.count({ where: { userId, read: false } }),
    area === "club" && clubId ? db.membership.count({ where: { clubId, status: "PENDING" } }) : 0,
    area === "admin" ? db.club.count({ where: { status: "PENDING" } }) : 0,
    area === "student"
      ? db.registration.count({ where: { userId, status: "REGISTERED", event: { endAt: { gte: new Date() }, status: "PUBLISHED" } } })
      : 0,
  ]);
  const badges: Record<string, number> = {};
  if (pendingMembers) badges["/club/members"] = pendingMembers;
  if (pendingClubs) badges["/admin/clubs"] = pendingClubs;
  if (upcomingRegs) badges["/student/registrations"] = upcomingRegs;
  return { notifications, unread, badges, pendingClubs };
}
