import "server-only";
import { cache } from "react";
import { db } from "./db";

export const DEFAULT_SETTINGS = {
  siteName: "UniQue",
  universityName: "Green Valley University",
  tagline: "Discover clubs. Join events. Be part of campus life.",
  contactEmail: "clubs@unique.edu",
  contactPhone: "+880 1700-000000",
  address: "Student Affairs Office, Block A, Main Campus",
  allowRegistration: "true",
  membershipApproval: "true",
  eventsPerPage: "9",

  // Google sign-in (managed from Admin → Settings)
  googleEnabled: "false",
  googleClientId: "",
  googleClientSecret: "",
  googleAllowedDomain: "",

  // Site graphics (managed from Admin → Appearance). Empty = built-in graphic.
  logo: "",
  favicon: "",
  ogImage: "",
  authImage: "",
  heroImage: "",
  bannerImage: "",
  defaultClubCover: "",
  defaultEventBanner: "",
};

/** Keys edited by the general "System preferences" form. */
export const GENERAL_KEYS = ["siteName", "universityName", "tagline", "contactEmail", "contactPhone", "address", "allowRegistration", "membershipApproval", "eventsPerPage"] as const;

/** Image slots shown on the Appearance page, in display order. */
export const MEDIA_SLOTS = [
  { key: "logo", group: "Brand", label: "Logo mark", hint: "Square icon shown next to the platform name in every header. 256 × 256 px, SVG or PNG with a transparent background works best.", aspect: "aspect-square", fallback: "The green U mark" },
  { key: "favicon", group: "Brand", label: "Favicon", hint: "Browser-tab icon. 64 × 64 px PNG, ICO or SVG.", aspect: "aspect-square", fallback: "The green U mark" },
  { key: "ogImage", group: "Brand", label: "Social share image", hint: "Preview image when a link is shared on Facebook, WhatsApp, etc. 1200 × 630 px.", aspect: "aspect-[1200/630]", fallback: "No preview image" },
  { key: "authImage", group: "Illustrations", label: "Sign-in illustration", hint: "Fills the side panel on the log-in, register and password pages. Portrait or square, at least 1400 px wide.", aspect: "aspect-[4/3]", fallback: "Campus notice-board illustration" },
  { key: "heroImage", group: "Illustrations", label: "Home page hero", hint: "Large image beside the home page headline. About 1200 × 1000 px.", aspect: "aspect-[6/5]", fallback: "Campus notice-board illustration" },
  { key: "bannerImage", group: "Illustrations", label: "Page banner background", hint: "Background of the title band on Clubs, Events, Announcements and About. Wide image, 1920 × 480 px; text is shown on top in white.", aspect: "aspect-[4/1]", fallback: "Plain light banner" },
  { key: "defaultClubCover", group: "Default covers", label: "Default club cover", hint: "Used for clubs that have not uploaded their own cover. 1600 × 600 px.", aspect: "aspect-[8/3]", fallback: "Generated colour pattern" },
  { key: "defaultEventBanner", group: "Default covers", label: "Default event banner", hint: "Used for events without their own banner. 1600 × 900 px.", aspect: "aspect-video", fallback: "Generated colour pattern" },
] as const;

export type MediaKey = (typeof MEDIA_SLOTS)[number]["key"];

export type Settings = typeof DEFAULT_SETTINGS;
export type SettingKey = keyof Settings;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.setting.findMany();
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) if (r.key in out) out[r.key as SettingKey] = r.value;
  return out;
});

export const flag = (v: string) => v === "true";

/** Google sign-in is usable only when switched on and both credentials are present. */
export const googleReady = (s: Settings) => flag(s.googleEnabled) && !!s.googleClientId && !!s.googleClientSecret;

/** Settings that are safe to send to the browser (never includes the Google client secret). */
export function publicMedia(s: Settings) {
  return { logo: s.logo, defaultClubCover: s.defaultClubCover, defaultEventBanner: s.defaultEventBanner };
}
