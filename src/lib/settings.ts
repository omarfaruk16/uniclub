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
};

export type Settings = typeof DEFAULT_SETTINGS;
export type SettingKey = keyof Settings;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.setting.findMany();
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) if (r.key in out) out[r.key as SettingKey] = r.value;
  return out;
});

export const flag = (v: string) => v === "true";
