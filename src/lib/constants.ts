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
