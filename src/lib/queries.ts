import "server-only";
import { db } from "./db";

/** Events visible on the public site. */
export const PUBLIC_EVENT = { status: "PUBLISHED", club: { status: "APPROVED" } } as const;

export const ACTIVE_REGS = { registrations: { where: { status: "REGISTERED" } } } as const;

/** What the signed-in participant has joined/registered, for card states. */
export async function participation(userId: string | undefined) {
  if (!userId) return { memberships: new Map<string, string>(), registrations: new Set<string>() };
  const [ms, rs] = await Promise.all([
    db.membership.findMany({ where: { userId }, select: { clubId: true, status: true } }),
    db.registration.findMany({ where: { userId, status: "REGISTERED" }, select: { eventId: true } }),
  ]);
  return {
    memberships: new Map(ms.map((m) => [m.clubId, m.status])),
    registrations: new Set(rs.map((r) => r.eventId)),
  };
}

export type RegState = "open" | "full" | "closed" | "cancelled" | "ended" | "draft";

export function registrationState(e: { status: string; registrationDeadline: Date; endAt: Date; capacity: number | null }, registered: number): RegState {
  if (e.status === "CANCELLED") return "cancelled";
  if (e.status !== "PUBLISHED") return "draft";
  const now = new Date();
  if (e.endAt < now) return "ended";
  if (e.registrationDeadline < now) return "closed";
  if (e.capacity && registered >= e.capacity) return "full";
  return "open";
}
