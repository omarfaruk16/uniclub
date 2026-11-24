export const CLUB_CATEGORIES = [
  "Technology",
  "Cultural",
  "Sports",
  "Academic",
  "Arts & Media",
  "Social Service",
  "Business",
  "Science",
] as const;

export const EVENT_CATEGORIES = [
  "Workshop",
  "Seminar",
  "Competition",
  "Cultural",
  "Sports",
  "Social",
  "Hackathon",
  "Meetup",
] as const;

export const ANNOUNCEMENT_CATEGORIES = ["General", "Academic", "Event", "Club", "Urgent"] as const;

export const ROLES = ["STUDENT", "REP", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Student",
  REP: "Club Representative",
  ADMIN: "Administrator",
};

export const ROLE_HOME: Record<string, string> = {
  STUDENT: "/student/dashboard",
  REP: "/club/dashboard",
  ADMIN: "/admin/dashboard",
};

export const PAGE_SIZE = 9;
export const TABLE_PAGE_SIZE = 12;

/** All event times are entered and shown in the university's time zone. */
export const TIME_ZONE = "Asia/Dhaka";
export const TZ_OFFSET = "+06:00";

/** Where admin-managed banners and ads can appear. */
export const BANNER_PLACEMENTS = [
  { value: "HOME_TOP", label: "Home page, below the hero" },
  { value: "HOME_MIDDLE", label: "Home page, before announcements" },
  { value: "CLUBS", label: "Explore Clubs page" },
  { value: "EVENTS", label: "Events page" },
  { value: "ANNOUNCEMENTS", label: "Announcements page" },
  { value: "STUDENT_DASHBOARD", label: "Student dashboard" },
] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number]["value"];

/** Where a signed-in user lands: `next` if that role may open it, otherwise their dashboard. */
export function landingFor(role: string, next: string) {
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "";
  const blocked: Record<string, RegExp> = {
    STUDENT: /^\/(club|admin)(\/|$)/,
    REP: /^\/admin(\/|$)/,
    ADMIN: /^\/(student|club)(\/|$)/,
  };
  return safe && !blocked[role]?.test(safe) ? safe : ROLE_HOME[role] ?? "/";
}
