/* eslint-disable no-console */
import { PrismaClient, type User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugify } from "../src/lib/utils";

const db = new PrismaClient();

// Deterministic pseudo-random so every reseed gives the same demo data.
let seed = 20261117;
const rand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]!;
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => rand() - 0.5);

/** A moment `days` from now at the given Dhaka wall-clock time. */
function at(days: number, hour = 10, minute = 0) {
  const base = new Date(Date.now() + days * 864e5);
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(base);
  return new Date(`${ymd}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+06:00`);
}
const daysAgo = (d: number) => new Date(Date.now() - d * 864e5 - Math.floor(rand() * 8) * 36e5);

const DEPARTMENTS = ["CSE", "EEE", "BBA", "English", "Civil Engineering", "Pharmacy", "Architecture", "Economics"];

const STUDENT_NAMES = [
  "Nusrat Jahan", "Tanvir Ahmed", "Sadia Islam", "Rakibul Hasan", "Farhana Akter", "Mehedi Hasan",
  "Anika Tabassum", "Arif Hossain", "Jannatul Ferdous", "Imran Khan", "Tasnim Rahman", "Sabbir Rahman",
  "Lamia Chowdhury", "Fahim Shahriar", "Mim Sultana", "Nafis Iqbal", "Raisa Karim", "Shakil Ahmed",
  "Tahsin Ara", "Zubair Hossain", "Priya Das", "Ashik Mahmud", "Sumaiya Noor", "Rifat Hasan",
  "Ishrat Jahan", "Tamim Iqbal Rafi", "Nabila Haque", "Sajid Alam",
];

const REP_NAMES = [
  "Ayesha Siddiqua", "Rafsan Chowdhury", "Maliha Rahman", "Shafiqul Islam",
  "Tasfia Hossain", "Kamrul Hasan", "Nadia Afrin", "Ehsan Kabir",
];

type ClubSeed = {
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  objectives: string[];
  email: string;
  foundedYear: number;
  featured: boolean;
  events: { title: string; category: string; venue: string; desc: string; day: number; hour: number; hours: number; capacity?: number; membersOnly?: boolean; status?: string }[];
};

const CLUBS: ClubSeed[] = [
  {
    name: "Computer & Programming Club",
    category: "Technology",
    shortDescription: "Competitive programming, software projects and tech talks for every skill level.",
    description:
      "The Computer & Programming Club brings together students who love building things with code. We run weekly problem-solving sessions, beginner bootcamps, project sprints and an annual intra-university programming contest. Members work in teams on real software, mentor juniors and represent the university at national contests.",
    objectives: [
      "Build strong problem-solving skills through weekly practice contests",
      "Help beginners learn programming with structured bootcamps",
      "Ship open-source and campus software projects in teams",
      "Represent the university at national and regional contests",
    ],
    email: "cpc@unique.edu",
    foundedYear: 2014,
    featured: true,
    events: [
      { title: "Intra-University Programming Contest 2026", category: "Competition", venue: "CSE Lab 3 & 4, Block C", desc: "A five-hour team contest in ICPC style. Teams of three solve 10-12 algorithmic problems. Prizes for the top three teams and the best all-female team. Laptops are provided by the lab.", day: 12, hour: 9, hours: 6, capacity: 90 },
      { title: "Web Development Bootcamp: Next.js from Zero", category: "Workshop", venue: "Seminar Room 402, Block C", desc: "A hands-on full-day workshop. You will build and deploy a small web app with Next.js and Tailwind CSS. Bring your own laptop with Node.js installed.", day: 5, hour: 10, hours: 5, capacity: 40 },
      { title: "Git & GitHub Crash Course", category: "Workshop", venue: "CSE Lab 2, Block C", desc: "Learn version control the practical way: commits, branches, pull requests and resolving merge conflicts with your teammates.", day: -24, hour: 14, hours: 2, capacity: 50 },
      { title: "Problem Solving Session #18", category: "Meetup", venue: "CSE Lab 1, Block C", desc: "Weekly members-only practice session on dynamic programming.", day: -62, hour: 15, hours: 2, membersOnly: true },
      { title: "AI Tools for Students (Draft)", category: "Seminar", venue: "TBA", desc: "Planning in progress.", day: 30, hour: 11, hours: 2, status: "DRAFT" },
    ],
  },
  {
    name: "Robotics & AI Society",
    category: "Technology",
    shortDescription: "Build robots, train models and compete in national robotics challenges.",
    description:
      "The Robotics & AI Society is a hands-on community for students interested in embedded systems, robotics and machine learning. We maintain a maker lab, run project teams for national competitions and organise workshops on Arduino, ROS and computer vision.",
    objectives: [
      "Give members hands-on access to tools and components in the maker lab",
      "Prepare teams for national robotics and AI competitions",
      "Teach practical machine learning and computer vision",
    ],
    email: "robotics@unique.edu",
    foundedYear: 2017,
    featured: true,
    events: [
      { title: "Line Follower Robot Challenge", category: "Competition", venue: "Central Courtyard", desc: "Design a robot that follows a track as fast as possible. Teams of up to four. Track rules and kit list are shared after registration.", day: 18, hour: 10, hours: 5, capacity: 60 },
      { title: "Intro to Computer Vision with Python", category: "Workshop", venue: "EEE Lab 5, Block B", desc: "Detect faces and objects in real time using OpenCV. Beginner friendly.", day: 8, hour: 14, hours: 3, capacity: 35 },
      { title: "Arduino Basics Workshop", category: "Workshop", venue: "Maker Lab, Block B", desc: "Blink LEDs, read sensors and drive motors. All components provided.", day: -40, hour: 11, hours: 3, capacity: 30 },
    ],
  },
  {
    name: "Debating Society",
    category: "Academic",
    shortDescription: "Sharpen your voice through British Parliamentary debate and public speaking.",
    description:
      "The Debating Society trains students in British Parliamentary and Asian Parliamentary formats. We hold weekly practice motions, host an annual inter-university tournament and send teams to national championships. Great speakers are made, not born.",
    objectives: [
      "Develop critical thinking and confident public speaking",
      "Hold weekly practice debates with feedback from adjudicators",
      "Host and compete in inter-university tournaments",
    ],
    email: "debate@unique.edu",
    foundedYear: 2012,
    featured: true,
    events: [
      { title: "Inter-University Debate Championship", category: "Competition", venue: "Main Auditorium", desc: "Two days of British Parliamentary debate with teams from twelve universities. Volunteers and audience welcome; competing teams register through the society.", day: 22, hour: 9, hours: 8, capacity: 120 },
      { title: "Public Speaking Masterclass", category: "Seminar", venue: "Room 201, Block A", desc: "Practical techniques for structure, voice and handling nerves, with live practice.", day: 3, hour: 15, hours: 2, capacity: 50 },
      { title: "Novice Debate Night", category: "Meetup", venue: "Room 201, Block A", desc: "A friendly first debate for newcomers.", day: -15, hour: 17, hours: 2, capacity: 40 },
    ],
  },
  {
    name: "Cultural & Music Club",
    category: "Cultural",
    shortDescription: "Music, dance, drama and the biggest cultural nights on campus.",
    description:
      "From Pohela Boishakh celebrations to the annual cultural night, the Cultural & Music Club keeps campus alive with performances. Members join bands, dance troupes and drama teams, and take the stage at university and national events.",
    objectives: [
      "Celebrate national and cultural days with campus-wide programmes",
      "Give students a stage for music, dance and drama",
      "Train members through regular practice sessions",
    ],
    email: "cultural@unique.edu",
    foundedYear: 2010,
    featured: true,
    events: [
      { title: "Annual Cultural Night 2026", category: "Cultural", venue: "Open Air Stage", desc: "An evening of music, dance and drama performed by students, followed by a live band. Free entry with registration.", day: 26, hour: 17, hours: 4, capacity: 400 },
      { title: "Open Mic Evening", category: "Cultural", venue: "Student Lounge", desc: "Sing, recite, play or perform anything. Sign up on arrival.", day: 9, hour: 18, hours: 2, capacity: 80 },
      { title: "Bijoy Dibosh Celebration Rehearsal", category: "Cultural", venue: "Music Room, Block D", desc: "Rehearsal for the Victory Day programme.", day: -70, hour: 16, hours: 3, membersOnly: true },
      { title: "Monsoon Melody", category: "Cultural", venue: "Main Auditorium", desc: "An evening of rain songs.", day: -120, hour: 17, hours: 3, capacity: 250 },
    ],
  },
  {
    name: "Sports Club",
    category: "Sports",
    shortDescription: "Football, cricket, badminton and the inter-department sports week.",
    description:
      "The Sports Club organises inter-department tournaments, fitness programmes and university teams for football, cricket, basketball and badminton. Whether you are an athlete or just want to stay active, there is a place for you.",
    objectives: [
      "Run inter-department tournaments throughout the year",
      "Select and train university teams",
      "Promote fitness and healthy competition",
    ],
    email: "sports@unique.edu",
    foundedYear: 2009,
    featured: false,
    events: [
      { title: "Inter-Department Football Tournament", category: "Sports", venue: "University Playground", desc: "Eight departments, one trophy. Register as a player for your department team or come to cheer.", day: 14, hour: 15, hours: 3, capacity: 160 },
      { title: "Badminton Singles Open", category: "Sports", venue: "Indoor Games Hall", desc: "Knock-out singles tournament for men and women.", day: 6, hour: 9, hours: 6, capacity: 64 },
      { title: "Cricket Trials", category: "Sports", venue: "University Playground", desc: "Trials for the university cricket team.", day: -95, hour: 7, hours: 4, capacity: 50 },
      { title: "Fun Run 5K (Cancelled)", category: "Sports", venue: "Campus Ring Road", desc: "Cancelled due to weather.", day: 2, hour: 6, hours: 2, status: "CANCELLED" },
    ],
  },
  {
    name: "Photography & Film Society",
    category: "Arts & Media",
    shortDescription: "Photo walks, short films and exhibitions that tell campus stories.",
    description:
      "The Photography & Film Society is for anyone who loves telling stories with a camera, phone or professional kit. We run photo walks, editing workshops, a short film festival and an annual exhibition.",
    objectives: [
      "Teach composition, lighting and editing",
      "Organise photo walks and short-film projects",
      "Showcase student work through exhibitions",
    ],
    email: "photo@unique.edu",
    foundedYear: 2015,
    featured: true,
    events: [
      { title: "Old Dhaka Photo Walk", category: "Workshop", venue: "Meet at Main Gate", desc: "A guided photo walk through Old Dhaka with on-the-spot tips. Any camera, including phones.", day: 11, hour: 7, hours: 5, capacity: 30 },
      { title: "Campus Through the Lens: Exhibition", category: "Cultural", venue: "Gallery, Block D", desc: "A week-long exhibition of student photography.", day: -30, hour: 10, hours: 7, capacity: 300 },
      { title: "Mobile Videography Workshop", category: "Workshop", venue: "Room 305, Block D", desc: "Shoot and edit a one-minute film using only your phone.", day: -140, hour: 14, hours: 3, capacity: 45 },
    ],
  },
  {
    name: "Social Welfare Club",
    category: "Social Service",
    shortDescription: "Blood donation drives, winter clothes campaigns and community service.",
    description:
      "The Social Welfare Club organises blood donation camps, winter clothing drives, flood relief and tutoring for underprivileged children. We believe students can make a real difference in their community.",
    objectives: [
      "Run regular blood donation and health camps",
      "Collect and distribute winter clothes and relief",
      "Volunteer for education programmes in local communities",
    ],
    email: "welfare@unique.edu",
    foundedYear: 2011,
    featured: false,
    events: [
      { title: "Blood Donation Camp", category: "Social", venue: "Medical Centre, Ground Floor", desc: "In partnership with a national blood bank. Donors receive a health check and certificate.", day: 4, hour: 9, hours: 6, capacity: 120 },
      { title: "Winter Clothes Drive", category: "Social", venue: "Main Gate Collection Booth", desc: "Donate warm clothes or volunteer to sort and distribute them.", day: 20, hour: 10, hours: 6 },
      { title: "Flood Relief Volunteering", category: "Social", venue: "Student Affairs Office", desc: "Packing and distributing relief.", day: -100, hour: 9, hours: 8, capacity: 60 },
    ],
  },
  {
    name: "Business & Entrepreneurship Club",
    category: "Business",
    shortDescription: "Case competitions, startup talks and networking with founders.",
    description:
      "The Business & Entrepreneurship Club connects students with founders, recruiters and investors. We host case competitions, startup pitch days and career workshops on CVs, interviews and personal branding.",
    objectives: [
      "Build business and leadership skills through case competitions",
      "Connect students with founders and industry professionals",
      "Support student startup ideas from pitch to prototype",
    ],
    email: "bec@unique.edu",
    foundedYear: 2016,
    featured: false,
    events: [
      { title: "Startup Pitch Day", category: "Competition", venue: "Main Auditorium", desc: "Student teams pitch their startup ideas to a panel of founders and investors. Top three teams win seed mentoring.", day: 16, hour: 14, hours: 4, capacity: 150 },
      { title: "CV & Interview Clinic", category: "Seminar", venue: "Room 110, Block A", desc: "One-to-one CV reviews and mock interviews with HR professionals.", day: 7, hour: 11, hours: 3, capacity: 40 },
      { title: "Case Competition Kickoff", category: "Competition", venue: "Room 110, Block A", desc: "Round one of the business case competition.", day: -52, hour: 10, hours: 5, capacity: 80 },
    ],
  },
];

const ANNOUNCEMENTS_UNI = [
  { title: "Club fair registration is now open", body: "All approved clubs can now book stalls for the Spring Club Fair. Stall booking closes in two weeks. Contact the Student Affairs Office for the floor plan.", category: "General", pinned: true, ago: 2 },
  { title: "Mid-term examination schedule published", body: "The mid-term examination schedule has been published. Club events must not be scheduled during the examination week. Please plan your activities accordingly.", category: "Academic", pinned: false, ago: 6 },
  { title: "Auditorium maintenance this weekend", body: "The Main Auditorium will be closed for maintenance this Friday and Saturday. Events booked for those days have been moved to the Open Air Stage.", category: "Urgent", pinned: false, ago: 9 },
  { title: "New club proposals for the semester", body: "Students who want to start a new club can submit a proposal from their dashboard. Proposals are reviewed by the Student Affairs Office within seven working days.", category: "Club", pinned: false, ago: 20 },
  { title: "Campus-wide cultural week dates announced", body: "Cultural week will run alongside the Annual Cultural Night. Departments and clubs are invited to take part.", category: "Event", pinned: false, ago: 35 },
];

const ANNOUNCEMENTS_CLUB: Record<string, { title: string; body: string; category: string; ago: number }[]> = {
  "Computer & Programming Club": [
    { title: "Contest team selection results", body: "Thank you to everyone who took part in the selection contest. The selected teams have been notified by email. Practice sessions start next Sunday at 3 pm in Lab 1.", category: "Club", ago: 3 },
    { title: "Bootcamp seats are limited", body: "Only 40 seats are available for the Next.js bootcamp. Register early and bring your laptop.", category: "Event", ago: 8 },
  ],
  "Debating Society": [
    { title: "Volunteers needed for the championship", body: "We need volunteers for registration, timekeeping and hospitality during the inter-university championship. Sign up with the society secretary.", category: "Event", ago: 4 },
  ],
  "Cultural & Music Club": [
    { title: "Auditions for Cultural Night", body: "Auditions for singers, dancers and actors will be held this week in the Music Room from 4 pm.", category: "Club", ago: 5 },
  ],
  "Social Welfare Club": [
    { title: "Blood donors: eligibility reminder", body: "Donors must be 18-60 years old, weigh over 50 kg and should not have donated in the last four months. Please eat before you come.", category: "General", ago: 1 },
  ],
  "Robotics & AI Society": [
    { title: "Maker lab hours extended", body: "The maker lab is now open until 8 pm on weekdays for members working on competition projects.", category: "Club", ago: 12 },
  ],
  "Photography & Film Society": [
    { title: "Exhibition photos are online", body: "Thank you for visiting Campus Through the Lens. Photos from the exhibition are now on our page.", category: "Club", ago: 25 },
  ],
};

// Passwords come from the environment in production; the demo defaults are for local use only.
const PASSWORDS = {
  admin: process.env.SEED_ADMIN_PASSWORD || "Admin@123",
  rep: process.env.SEED_REP_PASSWORD || "Rep@12345",
  student: process.env.SEED_STUDENT_PASSWORD || "Student@123",
  other: process.env.SEED_DEFAULT_PASSWORD || "Password@123",
};
const customPasswords = Boolean(process.env.SEED_ADMIN_PASSWORD);

async function main() {
  // The seed wipes every table, so refuse to run against a live database by accident.
  if (process.env.NODE_ENV === "production" && process.env.SEED_CONFIRM !== "yes") {
    console.error("Refusing to seed in production: this deletes ALL data. Re-run with SEED_CONFIRM=yes to proceed.");
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production" && !customPasswords) {
    console.error("Set SEED_ADMIN_PASSWORD, SEED_REP_PASSWORD, SEED_STUDENT_PASSWORD and SEED_DEFAULT_PASSWORD before seeding production.");
    process.exit(1);
  }
  console.log("Clearing old data…");
  await db.notification.deleteMany();
  await db.announcement.deleteMany();
  await db.registration.deleteMany();
  await db.event.deleteMany();
  await db.membership.deleteMany();
  await db.club.deleteMany();
  await db.passwordReset.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();
  await db.setting.deleteMany();

  const [adminPw, repPw, studentPw, defaultPw] = await Promise.all([
    bcrypt.hash(PASSWORDS.admin, 10),
    bcrypt.hash(PASSWORDS.rep, 10),
    bcrypt.hash(PASSWORDS.student, 10),
    bcrypt.hash(PASSWORDS.other, 10),
  ]);

  console.log("Creating users…");
  const admin = await db.user.create({
    data: { name: "Dr. Mahmudul Karim", email: "admin@unique.edu", passwordHash: adminPw, role: "ADMIN", department: "Student Affairs", createdAt: daysAgo(200) },
  });

  let sid = 1001;
  const studentId = () => `2211${String(sid++).padStart(6, "0")}`;

  const students: User[] = [];
  for (const [i, name] of STUDENT_NAMES.entries()) {
    const email = i === 0 ? "student@unique.edu" : `${slugify(name).replace(/-/g, ".")}@unique.edu`;
    students.push(
      await db.user.create({
        data: {
          name,
          email,
          studentId: studentId(),
          passwordHash: i === 0 ? studentPw : defaultPw,
          department: pick(DEPARTMENTS),
          status: i === STUDENT_NAMES.length - 1 ? "SUSPENDED" : "ACTIVE",
          createdAt: daysAgo(i === 0 ? 170 : Math.floor(rand() * 175) + 2),
          bio: i === 0 ? "CSE undergraduate who loves coding, debate and photography." : null,
        },
      }),
    );
  }

  const reps: User[] = [];
  for (const [i, name] of REP_NAMES.entries()) {
    const email = i === 0 ? "rep@unique.edu" : `${slugify(name).replace(/-/g, ".")}@unique.edu`;
    reps.push(
      await db.user.create({
        data: { name, email, studentId: studentId(), passwordHash: i === 0 ? repPw : defaultPw, role: "REP", department: pick(DEPARTMENTS), createdAt: daysAgo(180 + i) },
      }),
    );
  }

  const activeStudents = students.filter((s) => s.status === "ACTIVE");

  console.log("Creating clubs, events and registrations…");
  for (const [ci, c] of CLUBS.entries()) {
    const rep = reps[ci]!;
    const club = await db.club.create({
      data: {
        name: c.name,
        slug: slugify(c.name),
        category: c.category,
        shortDescription: c.shortDescription,
        description: c.description,
        objectives: c.objectives.join("\n"),
        email: c.email,
        foundedYear: c.foundedYear,
        featured: c.featured,
        status: "APPROVED",
        repId: rep.id,
        createdAt: daysAgo(190),
      },
    });

    await db.membership.create({ data: { userId: rep.id, clubId: club.id, status: "APPROVED", position: "President", createdAt: daysAgo(185) } });

    // Members: the demo student joins a fixed set of clubs; others join at random.
    const demoClubs = [0, 2, 5];
    const members = shuffle(activeStudents.slice(1)).slice(0, 7 + Math.floor(rand() * 9));
    if (demoClubs.includes(ci)) members.unshift(students[0]!);
    for (const [mi, m] of members.entries()) {
      const pending = m.id !== students[0]!.id && mi > members.length - 3 && rand() > 0.4;
      await db.membership.create({
        data: {
          userId: m.id,
          clubId: club.id,
          status: pending ? "PENDING" : "APPROVED",
          position: mi === 1 ? "General Secretary" : mi === 2 ? "Treasurer" : "Member",
          createdAt: daysAgo(Math.floor(rand() * 160) + 3),
        },
      });
    }
    if (ci === 1) {
      // Demo student has a pending request with the Robotics society.
      await db.membership.create({ data: { userId: students[0]!.id, clubId: club.id, status: "PENDING", createdAt: daysAgo(2) } });
    }
    const memberIds = members.map((m) => m.id);

    for (const e of c.events) {
      const startAt = at(e.day, e.hour);
      const endAt = new Date(startAt.getTime() + e.hours * 36e5);
      const deadline = new Date(startAt.getTime() - 864e5);
      const event = await db.event.create({
        data: {
          clubId: club.id,
          title: e.title,
          description: e.desc,
          category: e.category,
          venue: e.venue,
          startAt,
          endAt,
          registrationDeadline: deadline,
          capacity: e.capacity ?? null,
          membersOnly: e.membersOnly ?? false,
          featured: e.day > 0 && e.day < 20 && rand() > 0.5,
          status: e.status ?? "PUBLISHED",
          createdAt: new Date(Math.min(Date.now() - 864e5, startAt.getTime() - 20 * 864e5)),
        },
      });
      if (event.status !== "PUBLISHED") continue;

      // The demo student only gets the hand-picked registrations below.
      const pool = (e.membersOnly ? memberIds : activeStudents.map((s) => s.id)).filter((id) => id !== students[0]!.id);
      const cap = e.capacity ?? 60;
      const count = Math.min(pool.length, Math.max(4, Math.floor(cap * (0.25 + rand() * 0.45))));
      const chosen = shuffle(pool).slice(0, count);
      const isDemoEvent = ["Git & GitHub Crash Course", "Novice Debate Night", "Web Development Bootcamp: Next.js from Zero", "Public Speaking Masterclass", "Campus Through the Lens: Exhibition", "Old Dhaka Photo Walk", "Problem Solving Session #18", "Mobile Videography Workshop"].includes(e.title);
      if (isDemoEvent && !chosen.includes(students[0]!.id)) chosen.push(students[0]!.id);

      const past = e.day < 0;
      for (const uid of chosen) {
        const createdAt = new Date(Math.max(event.createdAt.getTime() + 36e5, startAt.getTime() - Math.floor(rand() * 18 + 1) * 864e5));
        await db.registration.create({
          data: {
            userId: uid,
            eventId: event.id,
            status: !past && rand() < 0.06 ? "CANCELLED" : "REGISTERED",
            attendance: past ? (uid === students[0]!.id ? (e.title.startsWith("Problem") ? "ABSENT" : "ATTENDED") : rand() < 0.78 ? "ATTENDED" : "ABSENT") : "PENDING",
            createdAt: createdAt > new Date() ? new Date() : createdAt,
          },
        });
      }
    }

    for (const a of ANNOUNCEMENTS_CLUB[c.name] ?? []) {
      await db.announcement.create({
        data: { title: a.title, body: a.body, category: a.category, clubId: club.id, authorId: rep.id, createdAt: daysAgo(a.ago) },
      });
    }
  }

  // A pending club proposal from a student, waiting for admin review.
  await db.club.create({
    data: {
      name: "Science & Astronomy Club",
      slug: "science-astronomy-club",
      category: "Science",
      shortDescription: "Stargazing nights, science fairs and experiments outside the classroom.",
      description: "A proposed club for students who love physics, chemistry and astronomy. We plan to run monthly stargazing nights with a telescope, science fair projects and talks by researchers.",
      objectives: "Hold monthly stargazing nights\nOrganise a campus science fair\nInvite researchers for public talks",
      status: "PENDING",
      proposedById: students[4]!.id,
      createdAt: daysAgo(1),
    },
  });

  console.log("Creating announcements and notifications…");
  for (const a of ANNOUNCEMENTS_UNI) {
    await db.announcement.create({ data: { title: a.title, body: a.body, category: a.category, pinned: a.pinned, authorId: admin.id, createdAt: daysAgo(a.ago) } });
  }

  const demo = students[0]!;
  const notes = [
    { title: "Registration confirmed", body: "You're registered for Web Development Bootcamp: Next.js from Zero.", link: "/student/registrations", type: "success", ago: 1 },
    { title: "New announcement from Computer & Programming Club", body: "Contest team selection results", link: "/student/announcements", type: "announcement", ago: 3 },
    { title: "Membership request sent", body: "Your request to join Robotics & AI Society is waiting for approval.", link: "/student/clubs", type: "info", ago: 2 },
    { title: "New event: Old Dhaka Photo Walk", body: "Photography & Film Society published a new event.", link: "/events", type: "event", ago: 6, read: true },
    { title: "Welcome to UniQue!", body: "Explore clubs, join the ones you love and register for events.", link: "/clubs", type: "info", ago: 160, read: true },
  ];
  for (const n of notes) {
    await db.notification.create({ data: { userId: demo.id, title: n.title, body: n.body, link: n.link, type: n.type, read: n.read ?? false, createdAt: daysAgo(n.ago) } });
  }
  await db.notification.create({ data: { userId: reps[0]!.id, title: "New membership request", body: "A student asked to join Computer & Programming Club.", link: "/club/members", type: "info", createdAt: daysAgo(1) } });
  await db.notification.create({ data: { userId: admin.id, title: "New club proposal", body: "Science & Astronomy Club is waiting for review.", link: "/admin/clubs?status=PENDING", type: "info", createdAt: daysAgo(1) } });

  console.log("\nSeed complete. Demo accounts: admin@unique.edu, rep@unique.edu, student@unique.edu");
  if (customPasswords) console.log("  Passwords: the SEED_*_PASSWORD values from the environment.");
  else console.log("  Passwords: Admin@123 / Rep@12345 / Student@123 (others: Password@123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
