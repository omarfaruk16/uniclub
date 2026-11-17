import "server-only";
import { db } from "./db";

export async function shellData(userId: string) {
  const [notifications, unread] = await Promise.all([
    db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.notification.count({ where: { userId, read: false } }),
  ]);
  return { notifications, unread };
}
