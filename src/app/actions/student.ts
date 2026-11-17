"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { actionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action";
import { flag, getSettings } from "@/lib/settings";
import { notify, notifyMany } from "@/lib/notify";
import { getString, slugify } from "@/lib/utils";
import { CLUB_CATEGORIES } from "@/lib/constants";
import { removeImage, saveImage } from "@/lib/uploads";

/** Students and club representatives (who are students too) can join clubs and events. */
const PARTICIPANT = ["STUDENT", "REP"];
const refresh = () => revalidatePath("/", "layout");

// ---------------------------------------------------------------- clubs

export async function joinClubAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const user = await actionUser(PARTICIPANT);
  if (!user) return fail("Please sign in with a student account to join clubs.");
  const club = await db.club.findUnique({ where: { id: getString(fd, "clubId") } });
  if (!club || club.status !== "APPROVED") return fail("This club is not accepting members.");

  const settings = await getSettings();
  const instant = !flag(settings.membershipApproval);
  const existing = await db.membership.findUnique({ where: { userId_clubId: { userId: user.id, clubId: club.id } } });
  if (existing && existing.status !== "REJECTED") {
    return fail(existing.status === "APPROVED" ? "You are already a member." : "Your request is already pending.");
  }
  const status = instant ? "APPROVED" : "PENDING";
  await db.membership.upsert({
    where: { userId_clubId: { userId: user.id, clubId: club.id } },
    create: { userId: user.id, clubId: club.id, status },
    update: { status, position: "Member" },
  });
  if (club.repId) {
    await notify(club.repId, {
      title: instant ? "New club member" : "New membership request",
      body: `${user.name} ${instant ? "joined" : "asked to join"} ${club.name}.`,
      link: "/club/members",
    });
  }
  refresh();
  return ok(instant ? `Welcome to ${club.name}!` : `Request sent. ${club.name} will review it soon.`);
}

export async function leaveClubAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const user = await actionUser(PARTICIPANT);
  if (!user) return fail("Please sign in first.");
  const clubId = getString(fd, "clubId");
  const club = await db.club.findUnique({ where: { id: clubId } });
  if (!club) return fail("Club not found.");
  if (club.repId === user.id) return fail("You represent this club, so you cannot leave it. Ask the administrator to reassign it first.");
  const m = await db.membership.findUnique({ where: { userId_clubId: { userId: user.id, clubId } } });
  if (!m) return fail("You are not a member of this club.");
  await db.membership.delete({ where: { id: m.id } });
  refresh();
  return ok(m.status === "PENDING" ? "Membership request withdrawn." : `You left ${club.name}.`);
}

export async function proposeClubAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const user = await actionUser(["STUDENT"]);
  if (!user) return fail("Only students can propose a new club.");
  const name = getString(fd, "name");
  const category = getString(fd, "category");
  const shortDescription = getString(fd, "shortDescription");
  const description = getString(fd, "description");
  const objectives = getString(fd, "objectives");
  const errors: Record<string, string> = {};
  if (name.length < 3) errors.name = "Enter the club name.";
  if (!CLUB_CATEGORIES.includes(category as never)) errors.category = "Choose a category.";
  if (shortDescription.length < 10) errors.shortDescription = "Write a one-line summary (10+ characters).";
  if (description.length < 30) errors.description = "Describe the club in a few sentences (30+ characters).";
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);

  const slug = slugify(name);
  if (await db.club.findFirst({ where: { OR: [{ name }, { slug }] } })) {
    return fail("A club with this name already exists.", { name: "Name already taken." });
  }
  const pending = await db.club.count({ where: { proposedById: user.id, status: "PENDING" } });
  if (pending > 0) return fail("You already have a club proposal waiting for review.");

  await db.club.create({
    data: { name, slug, category, shortDescription, description, objectives, status: "PENDING", proposedById: user.id },
  });
  const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  await notifyMany(admins.map((a) => a.id), {
    title: "New club proposal",
    body: `${user.name} proposed “${name}”.`,
    link: "/admin/clubs?status=PENDING",
  });
  refresh();
  return ok("Proposal submitted. The administrator will review it.");
}

// ---------------------------------------------------------------- events

export async function registerEventAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const user = await actionUser(PARTICIPANT);
  if (!user) return fail("Please sign in with a student account to register.");
  const event = await db.event.findUnique({
    where: { id: getString(fd, "eventId") },
    include: { club: true, _count: { select: { registrations: { where: { status: "REGISTERED" } } } } },
  });
  if (!event || event.status !== "PUBLISHED" || event.club.status !== "APPROVED") return fail("This event is not open for registration.");
  if (event.registrationDeadline < new Date()) return fail("Registration for this event has closed.");
  if (event.capacity && event._count.registrations >= event.capacity) return fail("Sorry, this event is full.");
  if (event.membersOnly) {
    const m = await db.membership.findUnique({ where: { userId_clubId: { userId: user.id, clubId: event.clubId } } });
    if (m?.status !== "APPROVED") return fail(`This event is for ${event.club.name} members only.`);
  }
  const existing = await db.registration.findUnique({ where: { userId_eventId: { userId: user.id, eventId: event.id } } });
  if (existing?.status === "REGISTERED") return fail("You are already registered.");

  await db.registration.upsert({
    where: { userId_eventId: { userId: user.id, eventId: event.id } },
    create: { userId: user.id, eventId: event.id },
    update: { status: "REGISTERED", attendance: "PENDING" },
  });
  await notify(user.id, {
    title: "Registration confirmed",
    body: `You're registered for ${event.title}.`,
    link: `/events/${event.id}`,
    type: "success",
  });
  refresh();
  return ok(`You're registered for ${event.title}!`);
}

export async function cancelRegistrationAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const user = await actionUser(PARTICIPANT);
  if (!user) return fail("Please sign in first.");
  const eventId = getString(fd, "eventId");
  const reg = await db.registration.findUnique({
    where: { userId_eventId: { userId: user.id, eventId } },
    include: { event: true },
  });
  if (!reg || reg.status !== "REGISTERED") return fail("You are not registered for this event.");
  if (reg.event.startAt < new Date()) return fail("This event has already started.");
  await db.registration.update({ where: { id: reg.id }, data: { status: "CANCELLED" } });
  refresh();
  return ok("Your registration was cancelled.");
}

// ---------------------------------------------------------------- notifications (all roles)

export async function markNotificationReadAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const user = await actionUser();
  if (!user) return fail("Please sign in first.");
  const id = getString(fd, "id");
  await db.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } });
  refresh();
  return { ok: true };
}

export async function markAllNotificationsReadAction(_?: ActionResult | null, __?: FormData): Promise<ActionResult> {
  const user = await actionUser();
  if (!user) return fail("Please sign in first.");
  await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  refresh();
  return ok("All notifications marked as read.");
}

export async function deleteNotificationAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const user = await actionUser();
  if (!user) return fail("Please sign in first.");
  await db.notification.deleteMany({ where: { id: getString(fd, "id"), userId: user.id } });
  refresh();
  return ok("Notification removed.");
}

/** Opens a notification: marks it read and follows its link. */
export async function openNotificationAction(fd: FormData) {
  const user = await actionUser();
  if (!user) redirect("/login");
  const n = await db.notification.findFirst({ where: { id: getString(fd, "id"), userId: user.id } });
  if (!n) redirect("/");
  await db.notification.update({ where: { id: n.id }, data: { read: true } });
  revalidatePath("/", "layout");
  redirect(n.link && n.link.startsWith("/") ? n.link : "/");
}

// ---------------------------------------------------------------- profile (all roles)

export async function updateProfileAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const user = await actionUser();
  if (!user) return fail("Please sign in first.");
  const name = getString(fd, "name");
  const department = getString(fd, "department");
  const phone = getString(fd, "phone");
  const bio = getString(fd, "bio");
  const errors: Record<string, string> = {};
  if (name.length < 3) errors.name = "Enter your full name.";
  if (phone && !/^[+\d][\d\s-]{6,18}$/.test(phone)) errors.phone = "Enter a valid phone number.";
  if (bio.length > 300) errors.bio = "Keep your bio under 300 characters.";
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);

  let avatar = user.avatar;
  const upload = await saveImage(fd.get("avatar"), "avatar");
  if (upload && "error" in upload) return fail(upload.error, { avatar: upload.error });
  if (upload) {
    await removeImage(avatar);
    avatar = upload.url;
  } else if (fd.get("remove_avatar") === "1") {
    await removeImage(avatar);
    avatar = null;
  }
  await db.user.update({
    where: { id: user.id },
    data: { name, department: department || null, phone: phone || null, bio: bio || null, avatar },
  });
  refresh();
  return ok("Profile updated.");
}

export async function changePasswordAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const user = await actionUser();
  if (!user) return fail("Please sign in first.");
  const current = String(fd.get("current") ?? "");
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const errors: Record<string, string> = {};
  if (!current) errors.current = "Enter your current password.";
  if (password.length < 8) errors.password = "Use at least 8 characters.";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = "Use both letters and numbers.";
  if (confirm !== password) errors.confirm = "Passwords do not match.";
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);

  const row = await db.user.findUnique({ where: { id: user.id } });
  if (!row || !(await verifyPassword(current, row.passwordHash))) {
    return fail("Your current password is incorrect.", { current: "Incorrect password." });
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  return ok("Password changed.");
}
