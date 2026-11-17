"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, hashToken, newToken, verifyPassword } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action";
import { ROLE_HOME } from "@/lib/constants";
import { getString } from "@/lib/utils";
import { flag, getSettings } from "@/lib/settings";
import { setFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "";
}

export async function loginAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const email = getString(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const errors: Record<string, string> = {};
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return fail("Incorrect email or password.");
  }
  if (user.status !== "ACTIVE") return fail("This account is suspended. Please contact the administrator.");

  await createSession(user.id);
  const next = safeNext(getString(fd, "next"));
  const home = ROLE_HOME[user.role] ?? "/";
  // Only follow `next` into an area this role may open.
  const blocked: Record<string, RegExp> = {
    STUDENT: /^\/(club|admin)(\/|$)/,
    REP: /^\/admin(\/|$)/,
    ADMIN: /^\/(student|club)(\/|$)/,
  };
  redirect(next && !blocked[user.role]?.test(next) ? next : home);
}

export async function registerAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const settings = await getSettings();
  if (!flag(settings.allowRegistration)) return fail("New student registration is currently closed.");

  const name = getString(fd, "name");
  const studentId = getString(fd, "studentId");
  const email = getString(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  const errors: Record<string, string> = {};
  if (name.length < 3) errors.name = "Enter your full name.";
  if (!/^[A-Za-z0-9-]{5,20}$/.test(studentId)) errors.studentId = "Student ID should be 5-20 letters or digits.";
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (password.length < 8) errors.password = "Use at least 8 characters.";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = "Use both letters and numbers.";
  if (confirm !== password) errors.confirm = "Passwords do not match.";
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);

  const [byEmail, byId] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.user.findUnique({ where: { studentId } }),
  ]);
  if (byEmail) return fail("An account with this email already exists.", { email: "Already registered. Try signing in." });
  if (byId) return fail("This student ID is already registered.", { studentId: "Already registered." });

  const user = await db.user.create({
    data: { name, studentId, email, passwordHash: await hashPassword(password), role: "STUDENT" },
  });
  await notify(user.id, {
    title: `Welcome to ${settings.siteName}!`,
    body: "Explore clubs, join the ones you love and register for events.",
    link: "/clubs",
  });
  await createSession(user.id);
  await setFlash(`Welcome, ${name.split(" ")[0]}! Your account is ready.`);
  redirect("/student/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const email = getString(fd, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return fail("Enter a valid email address.", { email: "Enter a valid email address." });

  const generic = "If an account exists for that email, a password reset link has been sent.";
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") return ok(generic);

  const token = newToken();
  await db.passwordReset.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });
  const link = `/reset-password?token=${token}`;
  // No email service is configured yet (automated email is a future enhancement in the outline).
  console.info(`[password reset] ${email}: ${link}`);
  const res = ok(generic);
  if (process.env.DEMO_MODE === "true") res.data = { link };
  return res;
}

export async function resetPasswordAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const token = getString(fd, "token");
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const errors: Record<string, string> = {};
  if (password.length < 8) errors.password = "Use at least 8 characters.";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = "Use both letters and numbers.";
  if (confirm !== password) errors.confirm = "Passwords do not match.";
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);

  const reset = await db.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return fail("This reset link is invalid or has expired. Please request a new one.");
  }
  await db.$transaction([
    db.user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(password) } }),
    db.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: reset.userId } }),
  ]);
  await setFlash("Password updated. Please sign in with your new password.");
  redirect("/login");
}
