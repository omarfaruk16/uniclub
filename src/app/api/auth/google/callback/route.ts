import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createSession, hashPassword, newToken } from "@/lib/auth";
import { flag, getSettings, googleReady } from "@/lib/settings";
import { GOOGLE_COOKIE, exchangeCode, googleRedirectUri, type GoogleProfile } from "@/lib/google";
import { landingFor } from "@/lib/constants";
import { setFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";

const fail = (code: string): never => redirect(`/login?error=${code}`);

/** Google sends the user back here. Signs in a linked or matching account, or creates a student account. */
export async function GET(req: NextRequest) {
  const s = await getSettings();
  if (!googleReady(s)) fail("google_off");

  const jar = await cookies();
  const raw = jar.get(GOOGLE_COOKIE)?.value;
  jar.delete({ name: GOOGLE_COOKIE, path: "/api/auth/google" });
  let saved: { state: string; verifier: string; next: string } | null = null;
  try {
    saved = raw ? JSON.parse(raw) : null;
  } catch {}

  const sp = req.nextUrl.searchParams;
  if (sp.get("error")) fail("google_cancelled");
  const code = sp.get("code");
  if (!saved || !code || sp.get("state") !== saved.state) fail("google_state");

  let profile: GoogleProfile;
  try {
    profile = await exchangeCode({ code: code!, verifier: saved!.verifier, clientId: s.googleClientId, clientSecret: s.googleClientSecret, redirectUri: await googleRedirectUri() });
  } catch (e) {
    console.error("[google sign-in]", e);
    return fail("google_failed");
  }

  const email = profile.email?.toLowerCase();
  if (!email || !profile.email_verified) fail("google_unverified");
  const domain = s.googleAllowedDomain.trim().toLowerCase().replace(/^@/, "");
  if (domain && !email!.endsWith(`@${domain}`)) fail("google_domain");

  let user = await db.user.findFirst({ where: { googleId: profile.sub } });
  let created = false;
  if (!user) {
    const byEmail = await db.user.findUnique({ where: { email: email! } });
    if (byEmail) {
      if (byEmail.googleId && byEmail.googleId !== profile.sub) fail("google_mismatch");
      user = await db.user.update({
        where: { id: byEmail.id },
        data: { googleId: profile.sub, avatar: byEmail.avatar ?? profile.picture ?? null },
      });
    } else {
      if (!flag(s.allowRegistration)) fail("google_no_account");
      user = await db.user.create({
        data: {
          name: profile.name?.trim() || email!.split("@")[0]!,
          email: email!,
          googleId: profile.sub,
          avatar: profile.picture ?? null,
          // Google accounts have no password until the student sets one via "Forgot password".
          passwordHash: await hashPassword(newToken()),
        },
      });
      created = true;
      await notify(user.id, {
        title: `Welcome to ${s.siteName}!`,
        body: "Add your student ID and department in your profile so clubs can recognise you.",
        link: "/student/profile",
        type: "success",
      });
    }
  }
  if (user!.status !== "ACTIVE") fail("suspended");

  await createSession(user!.id);
  if (created) {
    await setFlash("Account created with Google. Please add your student ID in your profile.");
    redirect("/student/profile");
  }
  redirect(landingFor(user!.role, saved!.next));
}
