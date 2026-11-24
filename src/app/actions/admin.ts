"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { actionUser, hashPassword } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action";
import { notify, notifyMany } from "@/lib/notify";
import { getString, slugify } from "@/lib/utils";
import { CLUB_CATEGORIES, ROLES } from "@/lib/constants";
import { removeImage, saveImage } from "@/lib/uploads";
import { GENERAL_KEYS, MEDIA_SLOTS, type SettingKey } from "@/lib/settings";
import { BANNER_PLACEMENTS } from "@/lib/constants";
import { setFlash } from "@/lib/flash";

const refresh = () => revalidatePath("/", "layout");
const admin = () => actionUser(["ADMIN"]);
const DENIED = "Administrator access required.";

/**
 * Makes `userId` the representative of `clubId`, replacing any previous rep on either side.
 * Previous reps who no longer manage a club go back to the student role.
 */
async function assignRep(clubId: string, userId: string) {
  const club = await db.club.findUniqueOrThrow({ where: { id: clubId } });
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const formerRepId = club.repId;
  await db.$transaction(async (tx) => {
    await tx.club.updateMany({ where: { repId: userId }, data: { repId: null } });
    await tx.club.update({ where: { id: clubId }, data: { repId: userId } });
    await tx.user.update({ where: { id: userId }, data: { role: "REP" } });
    await tx.membership.upsert({
      where: { userId_clubId: { userId, clubId } },
      create: { userId, clubId, status: "APPROVED", position: "President" },
      update: { status: "APPROVED", position: "President" },
    });
    if (formerRepId && formerRepId !== userId) {
      await tx.user.update({ where: { id: formerRepId }, data: { role: "STUDENT" } });
      await tx.membership.updateMany({ where: { userId: formerRepId, clubId }, data: { position: "Member" } });
    }
  });
  await notify(userId, {
    title: "You are now a club representative",
    body: `You manage ${club.name}. Open the club dashboard to get started.`,
    link: "/club/dashboard",
    type: "success",
  });
  if (formerRepId && formerRepId !== userId) {
    await notify(formerRepId, { title: "Club representative role ended", body: `${user.name} now represents ${club.name}.`, type: "info" });
  }
}

// ---------------------------------------------------------------- clubs

export async function approveClubAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const club = await db.club.findUnique({ where: { id: getString(fd, "clubId") }, include: { proposedBy: true } });
  if (!club) return fail("Club not found.");
  await db.club.update({ where: { id: club.id }, data: { status: "APPROVED", rejectionReason: null } });
  // A student who proposed the club becomes its representative.
  if (!club.repId && club.proposedBy && club.proposedBy.role !== "ADMIN") {
    const managing = await db.club.findUnique({ where: { repId: club.proposedBy.id } });
    if (!managing) await assignRep(club.id, club.proposedBy.id);
  }
  if (club.proposedById) {
    await notify(club.proposedById, { title: "Club approved", body: `${club.name} has been approved.`, link: `/clubs/${club.slug}`, type: "success" });
  } else if (club.repId) {
    await notify(club.repId, { title: "Club approved", body: `${club.name} is active again.`, link: "/club/dashboard", type: "success" });
  }
  refresh();
  return ok(`${club.name} approved.`);
}

export async function rejectClubAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const club = await db.club.findUnique({ where: { id: getString(fd, "clubId") } });
  if (!club) return fail("Club not found.");
  const reason = getString(fd, "reason").slice(0, 300);
  await db.club.update({ where: { id: club.id }, data: { status: "REJECTED", rejectionReason: reason || null, featured: false } });
  const to = club.proposedById ?? club.repId;
  if (to) await notify(to, { title: "Club proposal not approved", body: reason ? `${club.name}: ${reason}` : `${club.name} was not approved.`, type: "warning" });
  refresh();
  return ok(`${club.name} rejected.`);
}

export async function suspendClubAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const club = await db.club.findUnique({ where: { id: getString(fd, "clubId") } });
  if (!club) return fail("Club not found.");
  await db.club.update({ where: { id: club.id }, data: { status: "SUSPENDED", featured: false } });
  if (club.repId) await notify(club.repId, { title: "Club suspended", body: `${club.name} has been suspended by the administrator.`, type: "warning" });
  refresh();
  return ok(`${club.name} suspended. It is hidden from the public site.`);
}

export async function toggleClubFeaturedAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const club = await db.club.findUnique({ where: { id: getString(fd, "clubId") } });
  if (!club) return fail("Club not found.");
  if (!club.featured && club.status !== "APPROVED") return fail("Only approved clubs can be featured.");
  await db.club.update({ where: { id: club.id }, data: { featured: !club.featured } });
  refresh();
  return ok(club.featured ? "Removed from featured clubs." : "Added to featured clubs on the home page.");
}

export async function deleteClubAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const club = await db.club.findUnique({ where: { id: getString(fd, "clubId") }, include: { events: true } });
  if (!club) return fail("Club not found.");
  if (club.repId) {
    const repId = club.repId;
    await db.club.update({ where: { id: club.id }, data: { repId: null } });
    await db.user.update({ where: { id: repId }, data: { role: "STUDENT" } });
  }
  await db.club.delete({ where: { id: club.id } });
  await Promise.all([removeImage(club.logo), removeImage(club.cover), ...club.events.map((e) => removeImage(e.image))]);
  refresh();
  return ok(`${club.name} and its events were deleted.`);
}

export async function saveClubAdminAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const id = getString(fd, "id");
  const existing = id ? await db.club.findUnique({ where: { id } }) : null;
  if (id && !existing) return fail("Club not found.");

  const name = getString(fd, "name");
  const category = getString(fd, "category");
  const shortDescription = getString(fd, "shortDescription");
  const description = getString(fd, "description");
  const objectives = getString(fd, "objectives");
  const email = getString(fd, "email");
  const repId = getString(fd, "repId");
  const errors: Record<string, string> = {};
  if (name.length < 3) errors.name = "Enter the club name.";
  if (!CLUB_CATEGORIES.includes(category as never)) errors.category = "Choose a category.";
  if (shortDescription.length < 10 || shortDescription.length > 160) errors.shortDescription = "Keep the summary between 10 and 160 characters.";
  if (description.length < 30) errors.description = "Describe the club (30+ characters).";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);

  const slug = existing?.slug ?? slugify(name);
  const clash = await db.club.findFirst({ where: { OR: [{ name }, { slug }], NOT: existing ? { id: existing.id } : undefined } });
  if (clash) return fail("A club with this name already exists.", { name: "Name already taken." });

  const images: { logo?: string | null; cover?: string | null } = {};
  for (const key of ["logo", "cover"] as const) {
    const up = await saveImage(fd.get(key), `club-${key}`);
    if (up && "error" in up) return fail(up.error, { [key]: up.error });
    if (up) {
      await removeImage(existing?.[key]);
      images[key] = up.url;
    } else if (fd.get(`remove_${key}`) === "1") {
      await removeImage(existing?.[key]);
      images[key] = null;
    }
  }

  const data = { name, category, shortDescription, description, objectives, email: email || null, ...images };
  const club = existing
    ? await db.club.update({ where: { id: existing.id }, data })
    : await db.club.create({ data: { ...data, slug, status: "APPROVED" } });
  if (repId && repId !== club.repId) await assignRep(club.id, repId);

  refresh();
  await setFlash(existing ? "Club updated." : `${name} created.`);
  redirect("/admin/clubs");
}

// ---------------------------------------------------------------- users

export async function createUserAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const name = getString(fd, "name");
  const email = getString(fd, "email").toLowerCase();
  const studentId = getString(fd, "studentId");
  const role = getString(fd, "role");
  const password = String(fd.get("password") ?? "");
  const errors: Record<string, string> = {};
  if (name.length < 3) errors.name = "Enter the full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
  if (!ROLES.includes(role as never) || role === "REP") errors.role = "Choose Student or Administrator (assign reps from Representatives).";
  if (role === "STUDENT" && !/^[A-Za-z0-9-]{5,20}$/.test(studentId)) errors.studentId = "Students need a 5-20 character student ID.";
  if (password.length < 8) errors.password = "Use at least 8 characters.";
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);
  if (await db.user.findUnique({ where: { email } })) return fail("Email already registered.", { email: "Already registered." });
  if (studentId && (await db.user.findUnique({ where: { studentId } }))) return fail("Student ID already registered.", { studentId: "Already registered." });

  await db.user.create({
    data: { name, email, studentId: studentId || null, role, passwordHash: await hashPassword(password) },
  });
  refresh();
  return ok(`${name} was added.`);
}

export async function setUserRoleAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const me = await admin();
  if (!me) return fail(DENIED);
  const user = await db.user.findUnique({ where: { id: getString(fd, "userId") } });
  const role = getString(fd, "role");
  if (!user) return fail("User not found.");
  if (user.id === me.id) return fail("You cannot change your own role.");
  if (!["STUDENT", "ADMIN"].includes(role)) return fail("Assign club representatives from the Representatives page.");
  if (user.role === "REP") await db.club.updateMany({ where: { repId: user.id }, data: { repId: null } });
  await db.user.update({ where: { id: user.id }, data: { role } });
  await notify(user.id, { title: "Your role changed", body: `Your account role is now ${role === "ADMIN" ? "Administrator" : "Student"}.`, type: "info" });
  refresh();
  return ok(`${user.name} is now ${role === "ADMIN" ? "an administrator" : "a student"}.`);
}

export async function toggleUserStatusAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const me = await admin();
  if (!me) return fail(DENIED);
  const user = await db.user.findUnique({ where: { id: getString(fd, "userId") } });
  if (!user) return fail("User not found.");
  if (user.id === me.id) return fail("You cannot suspend your own account.");
  const status = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  await db.user.update({ where: { id: user.id }, data: { status } });
  if (status === "SUSPENDED") await db.session.deleteMany({ where: { userId: user.id } });
  refresh();
  return ok(status === "SUSPENDED" ? `${user.name} was suspended and signed out.` : `${user.name} was reactivated.`);
}

export async function deleteUserAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const me = await admin();
  if (!me) return fail(DENIED);
  const user = await db.user.findUnique({ where: { id: getString(fd, "userId") } });
  if (!user) return fail("User not found.");
  if (user.id === me.id) return fail("You cannot delete your own account.");
  await db.user.delete({ where: { id: user.id } });
  await removeImage(user.avatar);
  refresh();
  return ok(`${user.name} was deleted.`);
}

// ---------------------------------------------------------------- events

export async function setEventStatusAdminAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const event = await db.event.findUnique({ where: { id: getString(fd, "eventId") }, include: { club: true } });
  const status = getString(fd, "status");
  if (!event) return fail("Event not found.");
  if (!["PUBLISHED", "CANCELLED", "DRAFT"].includes(status)) return fail("Invalid status.");
  await db.event.update({ where: { id: event.id }, data: { status, featured: status === "PUBLISHED" ? event.featured : false } });
  if (status === "CANCELLED") {
    const regs = await db.registration.findMany({ where: { eventId: event.id, status: "REGISTERED" }, select: { userId: true } });
    await notifyMany([...regs.map((r) => r.userId), ...(event.club.repId ? [event.club.repId] : [])], {
      title: "Event cancelled",
      body: `${event.title} was cancelled by the administrator.`,
      link: `/events/${event.id}`,
      type: "warning",
    });
  }
  refresh();
  return ok(`Event marked as ${status.toLowerCase()}.`);
}

export async function toggleEventFeaturedAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const event = await db.event.findUnique({ where: { id: getString(fd, "eventId") } });
  if (!event) return fail("Event not found.");
  if (!event.featured && event.status !== "PUBLISHED") return fail("Only published events can be featured.");
  await db.event.update({ where: { id: event.id }, data: { featured: !event.featured } });
  refresh();
  return ok(event.featured ? "Event un-featured." : "Event featured on the home page.");
}

export async function deleteEventAdminAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const event = await db.event.findUnique({ where: { id: getString(fd, "eventId") } });
  if (!event) return fail("Event not found.");
  await db.event.delete({ where: { id: event.id } });
  await removeImage(event.image);
  refresh();
  return ok("Event deleted.");
}

// ---------------------------------------------------------------- representatives

export async function assignRepAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const clubId = getString(fd, "clubId");
  const userId = getString(fd, "userId");
  const errors: Record<string, string> = {};
  if (!clubId) errors.clubId = "Choose a club.";
  if (!userId) errors.userId = "Choose a student.";
  if (Object.keys(errors).length) return fail("Choose a club and a student.", errors);
  const [club, user] = await Promise.all([db.club.findUnique({ where: { id: clubId } }), db.user.findUnique({ where: { id: userId } })]);
  if (!club || !user) return fail("Club or user not found.");
  if (user.role === "ADMIN") return fail("Administrators cannot be club representatives.");
  if (user.status !== "ACTIVE") return fail("This account is suspended.");
  await assignRep(club.id, user.id);
  refresh();
  return ok(`${user.name} now represents ${club.name}.`);
}

export async function unassignRepAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const club = await db.club.findUnique({ where: { id: getString(fd, "clubId") }, include: { rep: true } });
  if (!club?.rep) return fail("This club has no representative.");
  const rep = club.rep;
  await db.$transaction([
    db.club.update({ where: { id: club.id }, data: { repId: null } }),
    db.user.update({ where: { id: rep.id }, data: { role: "STUDENT" } }),
    db.membership.updateMany({ where: { userId: rep.id, clubId: club.id }, data: { position: "Member" } }),
  ]);
  await notify(rep.id, { title: "Club representative role ended", body: `You no longer manage ${club.name}.`, type: "info" });
  refresh();
  return ok(`${rep.name} was removed as representative of ${club.name}.`);
}

// ---------------------------------------------------------------- settings

export async function saveSettingsAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const values: Partial<Record<SettingKey, string>> = {};
  for (const key of GENERAL_KEYS) {
    if (key === "allowRegistration" || key === "membershipApproval") values[key] = fd.get(key) === "on" ? "true" : "false";
    else if (fd.has(key)) values[key] = getString(fd, key);
  }
  const errors: Record<string, string> = {};
  if (!values.siteName || values.siteName.length < 2) errors.siteName = "Enter the platform name.";
  if (!values.universityName) errors.universityName = "Enter the university name.";
  if (values.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail)) errors.contactEmail = "Enter a valid email.";
  const perPage = Number(values.eventsPerPage);
  if (!Number.isInteger(perPage) || perPage < 3 || perPage > 48) errors.eventsPerPage = "Choose a number from 3 to 48.";
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);

  await db.$transaction(
    Object.entries(values).map(([key, value]) =>
      db.setting.upsert({ where: { key }, create: { key, value: value! }, update: { value: value! } }),
    ),
  );
  refresh();
  return ok("Settings saved.");
}

async function putSettings(values: Partial<Record<SettingKey, string>>) {
  await db.$transaction(
    Object.entries(values).map(([key, value]) => db.setting.upsert({ where: { key }, create: { key, value: value! }, update: { value: value! } })),
  );
}

// ---------------------------------------------------------------- Google sign-in

export async function saveGoogleSettingsAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const enabled = fd.get("googleEnabled") === "on";
  const clientId = getString(fd, "googleClientId");
  const secret = getString(fd, "googleClientSecret");
  const domain = getString(fd, "googleAllowedDomain").toLowerCase().replace(/^@/, "");
  const current = await db.setting.findUnique({ where: { key: "googleClientSecret" } });
  const hasSecret = Boolean(secret || current?.value);

  const errors: Record<string, string> = {};
  if (clientId && !/^[\w.-]+\.apps\.googleusercontent\.com$/.test(clientId)) errors.googleClientId = "This doesn't look like a Google OAuth client ID (it ends in .apps.googleusercontent.com).";
  if (domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) errors.googleAllowedDomain = "Enter a domain such as unique.edu, or leave it empty.";
  if (enabled && !clientId) errors.googleClientId = "Required to switch Google sign-in on.";
  if (enabled && !hasSecret) errors.googleClientSecret = "Required to switch Google sign-in on.";
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);

  const values: Partial<Record<SettingKey, string>> = { googleEnabled: enabled ? "true" : "false", googleClientId: clientId, googleAllowedDomain: domain };
  // An empty secret field keeps the saved secret; "remove" clears it.
  if (secret) values.googleClientSecret = secret;
  if (fd.get("clearSecret") === "1") values.googleClientSecret = "";
  await putSettings(values);
  refresh();
  return ok(enabled ? "Google sign-in is on." : "Google settings saved. Sign-in with Google is off.");
}

// ---------------------------------------------------------------- site graphics

export async function saveMediaAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const slot = MEDIA_SLOTS.find((m) => m.key === getString(fd, "slot"));
  if (!slot) return fail("Unknown image slot.");
  const current = (await db.setting.findUnique({ where: { key: slot.key } }))?.value ?? "";
  const upload = await saveImage(fd.get("image"), `site-${slot.key}`, { vector: true });
  if (upload && "error" in upload) return fail(upload.error, { image: upload.error });
  if (upload) {
    await removeImage(current);
    await putSettings({ [slot.key]: upload.url });
    refresh();
    return ok(`${slot.label} updated.`);
  }
  if (fd.get("remove_image") === "1") {
    await removeImage(current);
    await putSettings({ [slot.key]: "" });
    refresh();
    return ok(`${slot.label} reset to the built-in graphic.`);
  }
  return fail("Choose an image first.", { image: "Choose an image to upload." });
}

// ---------------------------------------------------------------- banners & ads

export async function saveBannerAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const id = getString(fd, "id");
  const title = getString(fd, "title");
  const link = getString(fd, "link");
  const placement = getString(fd, "placement");
  const sortOrder = Number(getString(fd, "sortOrder") || 0);
  const errors: Record<string, string> = {};
  if (title.length < 2) errors.title = "Give the banner a name (only admins see it, and it is used as the image description).";
  if (!BANNER_PLACEMENTS.some((p) => p.value === placement)) errors.placement = "Choose where the banner appears.";
  if (link && !/^(https?:\/\/|\/)/.test(link)) errors.link = "Use a full web address (https://…) or a site path such as /events.";
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 999) errors.sortOrder = "Use a whole number from 0 to 999.";
  const existing = id ? await db.banner.findUnique({ where: { id } }) : null;
  if (id && !existing) return fail("Banner not found.");
  const upload = await saveImage(fd.get("image"), "banner", { vector: true });
  if (upload && "error" in upload) errors.image = upload.error;
  if (!upload && !existing) errors.image = "Upload the banner image.";
  if (Object.keys(errors).length) {
    if (upload && "url" in upload) await removeImage(upload.url);
    return fail("Please fix the highlighted fields.", errors);
  }
  const data = { title, link: link || null, placement, sortOrder, active: fd.get("active") === "on" };
  if (existing) {
    if (upload && "url" in upload) await removeImage(existing.image);
    await db.banner.update({ where: { id }, data: { ...data, ...(upload && "url" in upload ? { image: upload.url } : {}) } });
  } else {
    await db.banner.create({ data: { ...data, image: (upload as { url: string }).url } });
  }
  refresh();
  return ok(existing ? "Banner updated." : "Banner added.");
}

export async function toggleBannerAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const banner = await db.banner.findUnique({ where: { id: getString(fd, "id") } });
  if (!banner) return fail("Banner not found.");
  await db.banner.update({ where: { id: banner.id }, data: { active: !banner.active } });
  refresh();
  return ok(banner.active ? "Banner hidden." : "Banner is live.");
}

export async function deleteBannerAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return fail(DENIED);
  const banner = await db.banner.findUnique({ where: { id: getString(fd, "id") } });
  if (!banner) return fail("Banner not found.");
  await db.banner.delete({ where: { id: banner.id } });
  await removeImage(banner.image);
  refresh();
  return ok("Banner deleted.");
}

