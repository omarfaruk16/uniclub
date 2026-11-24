import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";

export const GOOGLE_COOKIE = "unique_google_oauth";

/** Public origin of the site, as the browser sees it (works behind nginx/Cloudflare). */
export async function publicOrigin() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3070";
  const proto = h.get("x-forwarded-proto")?.split(",")[0] ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export const googleRedirectUri = async () => `${await publicOrigin()}/api/auth/google/callback`;

const b64url = (buf: Buffer) => buf.toString("base64url");

export function newPkce() {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge, state: b64url(randomBytes(16)) };
}

export type GoogleProfile = { sub: string; email: string; email_verified: boolean; name?: string; picture?: string };

/** Exchanges the authorization code and returns the verified Google profile. */
export async function exchangeCode(opts: { code: string; verifier: string; clientId: string; clientSecret: string; redirectUri: string }): Promise<GoogleProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: opts.code,
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      redirect_uri: opts.redirectUri,
      grant_type: "authorization_code",
      code_verifier: opts.verifier,
    }),
    cache: "no-store",
  });
  if (!tokenRes.ok) throw new Error(`token ${tokenRes.status}: ${(await tokenRes.text()).slice(0, 200)}`);
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) throw new Error("no access token");
  // The token came straight from Google over TLS, so asking Google's userinfo endpoint is a trusted check.
  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${access_token}` }, cache: "no-store" });
  if (!infoRes.ok) throw new Error(`userinfo ${infoRes.status}`);
  return (await infoRes.json()) as GoogleProfile;
}
