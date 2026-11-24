/** Deterministic colours and category icons for generated graphics (usable on server and client). */
import {
  Briefcase, Camera, Code2, Cpu, Dumbbell, FlaskConical, GraduationCap, HeartHandshake,
  Mic, Music, Presentation, Trophy, Users, Wrench, CalendarDays,
} from "lucide-react";

const PALETTE: [string, string][] = [
  ["#176B50", "#0B3328"],
  ["#258660", "#0F4534"],
  ["#1F6F8B", "#0E3B4D"],
  ["#B97A12", "#7A4E0C"],
  ["#5B4B9A", "#2E2556"],
  ["#A2452F", "#5E2117"],
  ["#2E7D6B", "#123F36"],
  ["#3E6B2F", "#1F3A16"],
];

export function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export const paletteFor = (seed: string) => PALETTE[hash(seed) % PALETTE.length]!;

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Technology: Cpu,
  Cultural: Music,
  Sports: Dumbbell,
  Academic: GraduationCap,
  "Arts & Media": Camera,
  "Social Service": HeartHandshake,
  Social: HeartHandshake,
  Business: Briefcase,
  Science: FlaskConical,
  Workshop: Wrench,
  Seminar: Presentation,
  Competition: Trophy,
  Hackathon: Code2,
  Meetup: Users,
  Debate: Mic,
};

export const categoryIcon = (c: string) => ICONS[c] ?? CalendarDays;

