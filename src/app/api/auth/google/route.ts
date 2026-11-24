import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getSettings, googleReady } from "@/lib/settings";
import { GOOGLE_COOKIE, googleRedirectUri, newPkce } from "@/lib/google";

/** Starts "Continue with Google": remembers state + PKCE verifier in a short-lived cookie and sends the user to Google. */
export async function GET(req: NextRequest) {
  const s = await getSettings();
  if (!googleReady(s)) redirect("/login?error=google_off");
  const next = req.nextUrl.searchParams.get("next") ?? "";
  const { verifier, challenge, state } = newPkce();
  const jar = await cookies();
  jar.set(GOOGLE_COOKIE, JSON.stringify({ state, verifier, next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/google",
    maxAge: 600,
  });
  const params = new URLSearchParams({
    client_id: s.googleClientId,
    redirect_uri: await googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  if (s.googleAllowedDomain) params.set("hd", s.googleAllowedDomain);
  redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
