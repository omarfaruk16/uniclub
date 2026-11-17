import "server-only";
import { redirect } from "next/navigation";
import { getRepClub, requireRole } from "./auth";

/** Guard for club-dashboard pages that need an assigned club. */
export async function requireRepClub() {
  const user = await requireRole(["REP"]);
  const club = await getRepClub(user.id);
  if (!club) redirect("/club/dashboard");
  return { user, club };
}
