import "server-only";
import { db } from "./db";

type Note = { title: string; body: string; link?: string; type?: "info" | "success" | "warning" | "event" | "announcement" };

export async function notify(userId: string, note: Note) {
  await db.notification.create({ data: { userId, ...note } });
}

export async function notifyMany(userIds: string[], note: Note) {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return;
  await db.notification.createMany({ data: ids.map((userId) => ({ userId, ...note })) });
}

export async function clubMemberIds(clubId: string) {
  const rows = await db.membership.findMany({
    where: { clubId, status: "APPROVED" },
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
}
