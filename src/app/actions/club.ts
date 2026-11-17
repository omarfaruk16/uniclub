"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { actionUser } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action";
import { clubMemberIds, notify, notifyMany } from "@/lib/notify";
import { fromInputParts, getString } from "@/lib/utils";
import { ANNOUNCEMENT_CATEGORIES, CLUB_CATEGORIES, EVENT_CATEGORIES } from "@/lib/constants";
import { removeImage, saveImage } from "@/lib/uploads";
import { setFlash } from "@/lib/flash";

const refresh = () => revalidatePath("/", "layout");

/** The signed-in representative and the club they manage. */
async function repContext() {
  const user = await actionUser(["REP"]);
  if (!user) return null;
  const club = await db.club.findUnique({ where: { repId: user.id } });
  if (!club) return null;
  return { user, club };
}
const NO_ACCESS = "You need to be the representative of a club to do this.";

// ---------------------------------------------------------------- club profile

export async function updateClubProfileAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await repContext();
  if (!ctx) return fail(NO_ACCESS);
  const { club } = ctx;

  const name = getString(fd, "name");
  const category = getString(fd, "category");
  const shortDescription = getString(fd, "shortDescription");
  const description = getString(fd, "description");
  const objectives = getString(fd, "objectives");
  const email = getString(fd, "email");
  const foundedYear = getString(fd, "foundedYear");
  const errors: Record<string, string> = {};
  if (name.length < 3) errors.name = "Enter the club name.";
  if (!CLUB_CATEGORIES.includes(category as never)) errors.category = "Choose a category.";
  if (shortDescription.length < 10 || shortDescription.length > 160) errors.shortDescription = "Keep the summary between 10 and 160 characters.";
  if (description.length < 30) errors.description = "Describe the club in a few sentences (30+ characters).";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
  const year = foundedYear ? Number(foundedYear) : null;
  if (year !== null && (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear())) errors.foundedYear = "Enter a valid year.";
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);

  if (name !== club.name && (await db.club.findUnique({ where: { name } }))) {
    return fail("Another club already uses this name.", { name: "Name already taken." });
  }

  const images: { logo?: string | null; cover?: string | null } = {};
  for (const key of ["logo", "cover"] as const) {
    const up = await saveImage(fd.get(key), `club-${key}`);
    if (up && "error" in up) return fail(up.error, { [key]: up.error });
    if (up) {
      await removeImage(club[key]);
      images[key] = up.url;
    } else if (fd.get(`remove_${key}`) === "1") {
      await removeImage(club[key]);
      images[key] = null;
    }
  }

  await db.club.update({
    where: { id: club.id },
    data: { name, category, shortDescription, description, objectives, email: email || null, foundedYear: year, ...images },
  });
  refresh();
  return ok("Club profile saved.");
}

// ---------------------------------------------------------------- members

async function ownMembership(fd: FormData) {
  const ctx = await repContext();
  if (!ctx) return null;
  const m = await db.membership.findUnique({ where: { id: getString(fd, "membershipId") }, include: { user: true } });
  if (!m || m.clubId !== ctx.club.id) return null;
  return { ...ctx, m };
}

export async function approveMemberAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await ownMembership(fd);
  if (!ctx) return fail(NO_ACCESS);
  await db.membership.update({ where: { id: ctx.m.id }, data: { status: "APPROVED" } });
  await notify(ctx.m.userId, {
    title: "Membership approved",
    body: `You are now a member of ${ctx.club.name}.`,
    link: `/clubs/${ctx.club.slug}`,
    type: "success",
  });
  refresh();
  return ok(`${ctx.m.user.name} is now a member.`);
}

export async function rejectMemberAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await ownMembership(fd);
  if (!ctx) return fail(NO_ACCESS);
  await db.membership.update({ where: { id: ctx.m.id }, data: { status: "REJECTED" } });
  await notify(ctx.m.userId, {
    title: "Membership request declined",
    body: `${ctx.club.name} could not accept your request this time.`,
    link: "/student/clubs",
    type: "warning",
  });
  refresh();
  return ok("Request declined.");
}

export async function removeMemberAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await ownMembership(fd);
  if (!ctx) return fail(NO_ACCESS);
  if (ctx.m.userId === ctx.user.id) return fail("You cannot remove yourself.");
  await db.membership.delete({ where: { id: ctx.m.id } });
  await notify(ctx.m.userId, { title: "Removed from club", body: `Your membership of ${ctx.club.name} has ended.`, link: "/student/clubs", type: "warning" });
  refresh();
  return ok(`${ctx.m.user.name} was removed.`);
}

export async function updateMemberPositionAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await ownMembership(fd);
  if (!ctx) return fail(NO_ACCESS);
  const position = getString(fd, "position").slice(0, 40) || "Member";
  await db.membership.update({ where: { id: ctx.m.id }, data: { position } });
  refresh();
  return ok("Position updated.");
}

// ---------------------------------------------------------------- events

function parseEvent(fd: FormData) {
  const title = getString(fd, "title");
  const description = getString(fd, "description");
  const category = getString(fd, "category");
  const venue = getString(fd, "venue");
  const date = getString(fd, "date");
  const startAt = fromInputParts(date, getString(fd, "startTime"));
  const endAt = fromInputParts(date, getString(fd, "endTime"));
  const deadline = fromInputParts(getString(fd, "deadlineDate"), getString(fd, "deadlineTime") || "23:59");
  const capacityRaw = getString(fd, "capacity");
  const capacity = capacityRaw ? Number(capacityRaw) : null;
  const membersOnly = fd.get("membersOnly") === "on";

  const errors: Record<string, string> = {};
  if (title.length < 5) errors.title = "Enter an event title (5+ characters).";
  if (description.length < 20) errors.description = "Describe the event (20+ characters).";
  if (!EVENT_CATEGORIES.includes(category as never)) errors.category = "Choose a category.";
  if (venue.length < 2) errors.venue = "Enter the venue.";
  if (!startAt) errors.date = "Choose the date and start time.";
  if (!endAt) errors.endTime = "Choose the end time.";
  if (startAt && endAt && endAt <= startAt) errors.endTime = "End time must be after the start time.";
  if (!deadline) errors.deadlineDate = "Choose the registration deadline.";
  if (deadline && startAt && deadline > startAt) errors.deadlineDate = "Registration must close before the event starts.";
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1 || capacity > 10000)) errors.capacity = "Capacity must be a whole number from 1 to 10,000.";

  return { errors, data: { title, description, category, venue, startAt: startAt!, endAt: endAt!, registrationDeadline: deadline!, capacity, membersOnly } };
}

export async function saveEventAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await repContext();
  if (!ctx) return fail(NO_ACCESS);
  const { club } = ctx;
  if (club.status !== "APPROVED") return fail("Your club must be approved before it can publish events.");

  const id = getString(fd, "id");
  const intent = getString(fd, "intent"); // "publish" | "draft"
  const existing = id ? await db.event.findUnique({ where: { id } }) : null;
  if (id && (!existing || existing.clubId !== club.id)) return fail("Event not found.");

  const { errors, data } = parseEvent(fd);
  if (!existing && data.startAt && data.startAt < new Date()) errors.date = "The event must be in the future.";
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);

  let image = existing?.image ?? null;
  const up = await saveImage(fd.get("image"), "event");
  if (up && "error" in up) return fail(up.error, { image: up.error });
  if (up) {
    await removeImage(image);
    image = up.url;
  } else if (fd.get("remove_image") === "1") {
    await removeImage(image);
    image = null;
  }

  const status = existing?.status === "CANCELLED" ? "CANCELLED" : intent === "publish" ? "PUBLISHED" : existing?.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const event = existing
    ? await db.event.update({ where: { id: existing.id }, data: { ...data, image, status } })
    : await db.event.create({ data: { ...data, image, status, clubId: club.id } });

  const newlyPublished = status === "PUBLISHED" && existing?.status !== "PUBLISHED";
  if (newlyPublished) {
    await notifyMany((await clubMemberIds(club.id)).filter((id) => id !== ctx.user.id), {
      title: `New event: ${event.title}`,
      body: `${club.name} published a new event.`,
      link: `/events/${event.id}`,
      type: "event",
    });
  } else if (existing && status === "PUBLISHED") {
    const regs = await db.registration.findMany({ where: { eventId: event.id, status: "REGISTERED" }, select: { userId: true } });
    await notifyMany(regs.map((r) => r.userId), {
      title: "Event updated",
      body: `Details for ${event.title} were updated. Please check the date, time and venue.`,
      link: `/events/${event.id}`,
      type: "event",
    });
  }
  refresh();
  await setFlash(existing ? "Event updated." : status === "PUBLISHED" ? "Event published!" : "Draft saved.");
  redirect("/club/events");
}

async function ownEvent(fd: FormData) {
  const ctx = await repContext();
  if (!ctx) return null;
  const event = await db.event.findUnique({ where: { id: getString(fd, "eventId") } });
  if (!event || event.clubId !== ctx.club.id) return null;
  return { ...ctx, event };
}

export async function publishEventAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await ownEvent(fd);
  if (!ctx) return fail(NO_ACCESS);
  if (ctx.club.status !== "APPROVED") return fail("Your club must be approved before it can publish events.");
  if (ctx.event.status !== "DRAFT") return fail("Only drafts can be published.");
  if (ctx.event.startAt < new Date()) return fail("This event's date has passed. Edit the date first.");
  await db.event.update({ where: { id: ctx.event.id }, data: { status: "PUBLISHED" } });
  await notifyMany((await clubMemberIds(ctx.club.id)).filter((id) => id !== ctx.user.id), {
    title: `New event: ${ctx.event.title}`,
    body: `${ctx.club.name} published a new event.`,
    link: `/events/${ctx.event.id}`,
    type: "event",
  });
  refresh();
  return ok("Event published.");
}

export async function cancelEventAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await ownEvent(fd);
  if (!ctx) return fail(NO_ACCESS);
  await db.event.update({ where: { id: ctx.event.id }, data: { status: "CANCELLED" } });
  const regs = await db.registration.findMany({ where: { eventId: ctx.event.id, status: "REGISTERED" }, select: { userId: true } });
  await notifyMany(regs.map((r) => r.userId), {
    title: "Event cancelled",
    body: `${ctx.event.title} has been cancelled by ${ctx.club.name}.`,
    link: `/events/${ctx.event.id}`,
    type: "warning",
  });
  refresh();
  return ok("Event cancelled and registrants notified.");
}

export async function deleteEventAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await ownEvent(fd);
  if (!ctx) return fail(NO_ACCESS);
  const upcoming = ctx.event.status === "PUBLISHED" && ctx.event.startAt > new Date();
  if (upcoming) {
    const regs = await db.registration.findMany({ where: { eventId: ctx.event.id, status: "REGISTERED" }, select: { userId: true } });
    await notifyMany(regs.map((r) => r.userId), {
      title: "Event removed",
      body: `${ctx.event.title} by ${ctx.club.name} has been removed.`,
      link: "/events",
      type: "warning",
    });
  }
  await db.event.delete({ where: { id: ctx.event.id } });
  await removeImage(ctx.event.image);
  refresh();
  return ok("Event deleted.");
}

// ---------------------------------------------------------------- registrations

export async function setAttendanceAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await repContext();
  if (!ctx) return fail(NO_ACCESS);
  const reg = await db.registration.findUnique({ where: { id: getString(fd, "registrationId") }, include: { event: true } });
  if (!reg || reg.event.clubId !== ctx.club.id) return fail("Registration not found.");
  const attendance = getString(fd, "attendance");
  if (!["PENDING", "ATTENDED", "ABSENT"].includes(attendance)) return fail("Invalid attendance value.");
  if (attendance !== "PENDING" && reg.event.startAt > new Date()) return fail("Attendance can be marked once the event has started.");
  await db.registration.update({ where: { id: reg.id }, data: { attendance } });
  refresh();
  return ok(attendance === "ATTENDED" ? "Marked as attended." : attendance === "ABSENT" ? "Marked as absent." : "Attendance cleared.");
}

export async function setRegistrationStatusAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await repContext();
  if (!ctx) return fail(NO_ACCESS);
  const reg = await db.registration.findUnique({ where: { id: getString(fd, "registrationId") }, include: { event: true } });
  if (!reg || reg.event.clubId !== ctx.club.id) return fail("Registration not found.");
  const status = getString(fd, "status");
  if (!["REGISTERED", "CANCELLED"].includes(status)) return fail("Invalid status.");
  await db.registration.update({ where: { id: reg.id }, data: { status } });
  await notify(reg.userId, {
    title: status === "CANCELLED" ? "Registration cancelled" : "Registration restored",
    body: `${ctx.club.name} ${status === "CANCELLED" ? "cancelled" : "restored"} your registration for ${reg.event.title}.`,
    link: "/student/registrations",
    type: status === "CANCELLED" ? "warning" : "success",
  });
  refresh();
  return ok(status === "CANCELLED" ? "Registration cancelled." : "Registration restored.");
}

// ---------------------------------------------------------------- announcements (club + admin)

export async function saveAnnouncementAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const user = await actionUser(["REP", "ADMIN"]);
  if (!user) return fail("You do not have permission to post announcements.");
  const club = user.role === "REP" ? await db.club.findUnique({ where: { repId: user.id } }) : null;
  if (user.role === "REP" && !club) return fail(NO_ACCESS);

  const id = getString(fd, "id");
  const title = getString(fd, "title");
  const body = getString(fd, "body");
  const category = getString(fd, "category");
  const pinned = user.role === "ADMIN" && fd.get("pinned") === "on";
  const errors: Record<string, string> = {};
  if (title.length < 5) errors.title = "Enter a title (5+ characters).";
  if (body.length < 10) errors.body = "Write the announcement (10+ characters).";
  if (!ANNOUNCEMENT_CATEGORIES.includes(category as never)) errors.category = "Choose a category.";
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);

  if (id) {
    const a = await db.announcement.findUnique({ where: { id } });
    if (!a || (user.role === "REP" && a.clubId !== club!.id)) return fail("Announcement not found.");
    await db.announcement.update({ where: { id }, data: { title, body, category, pinned: user.role === "ADMIN" ? pinned : a.pinned } });
    refresh();
    return ok("Announcement updated.");
  }

  await db.announcement.create({ data: { title, body, category, pinned, clubId: club?.id ?? null, authorId: user.id } });
  // Club notices go to members; university notices go to every active student and representative.
  const recipients = club
    ? (await clubMemberIds(club.id)).filter((uid) => uid !== user.id)
    : (await db.user.findMany({ where: { status: "ACTIVE", role: { in: ["STUDENT", "REP"] } }, select: { id: true } })).map((u) => u.id);
  await notifyMany(recipients, {
    title: club ? `New announcement from ${club.name}` : "New university announcement",
    body: title,
    link: "/announcements",
    type: "announcement",
  });
  refresh();
  return ok("Announcement published.");
}

export async function deleteAnnouncementAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const user = await actionUser(["REP", "ADMIN"]);
  if (!user) return fail("You do not have permission.");
  const a = await db.announcement.findUnique({ where: { id: getString(fd, "id") } });
  if (!a) return fail("Announcement not found.");
  if (user.role === "REP") {
    const club = await db.club.findUnique({ where: { repId: user.id } });
    if (!club || a.clubId !== club.id) return fail("You can only delete your club's announcements.");
  }
  await db.announcement.delete({ where: { id: a.id } });
  refresh();
  return ok("Announcement deleted.");
}
