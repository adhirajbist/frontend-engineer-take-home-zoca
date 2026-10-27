/**
 * Generates src/data/clients.json for "Lumen Hair & Spa".
 * Run with: npm run generate:clients
 *
 * Seeded, so the same day always gives the same output. Dates are relative to
 * the day the script runs, except the first 5 rows, which are copied from the brief.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Client } from "../src/types";

const SEED = 20261026;
const TOTAL = 200;
const OUTPUT = join(process.cwd(), "src/data/clients.json");
const DAY_MS = 24 * 60 * 60 * 1000;

// Seeded random numbers (mulberry32).
let state = SEED;
function random(): number {
  state = (state + 0x6d2b79f5) | 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const chance = (p: number) => random() < p;
const randInt = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const pick = <T,>(items: readonly T[]): T => items[Math.floor(random() * items.length)];

// Dates are handled as UTC midnights of local calendar days.
const now = new Date();
const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
const toDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const daysAgo = (days: number) => toDate(today - days * DAY_MS);
const daysFromNow = (days: number) => toDate(today + days * DAY_MS);
const daysSince = (date: string) => Math.round((today - Date.parse(date)) / DAY_MS);

const FIRST_NAMES = [
  "Ananya", "Sofia", "Fatima", "Mei", "Olivia", "Keisha", "Yuki", "Camila", "Zara", "Hannah",
  "Nadia", "Amara", "Leah", "Isabella", "Rina", "Grace", "Lucia", "Divya", "Chloe", "Imani",
  "Sana", "Elena", "Ava", "Thandiwe", "Hye-jin", "Noor", "Gabriela", "Maya", "Ingrid", "Tanvi",
  "Ruth", "Lin", "Valentina", "Ayesha", "Naomi", "Kavya", "Jasmine", "Ximena", "Ama", "Sophie",
  "Marcus", "Daniel", "Arjun", "Diego", "Kenji", "Omar", "Malik", "Ethan", "Rahul", "Mateo",
  "Wei", "Samuel", "Tomás", "Kwame", "Alex", "Sam", "Riley", "Taylor", "Noah", "Ravi",
] as const;

const LAST_NAMES = [
  "Patel", "Garcia", "Nguyen", "Johnson", "Kim", "Okafor", "Rossi", "Haddad", "Singh", "Williams",
  "Tanaka", "Hernandez", "Ahmed", "Brown", "Cohen", "Mensah", "Martinez", "Iyer", "Wang", "Davis",
  "Silva", "Nakamura", "Kowalski", "Reyes", "Osei", "Murphy", "Gupta", "Park", "Ali", "Fischer",
  "Torres", "Adeyemi", "Chowdhury", "Nielsen", "Lopez", "Mehta", "Choi", "Moreau", "Hassan", "Clarke",
] as const;

const SERVICE_WEIGHTS: Record<string, number> = {
  Haircut: 30,
  Blowout: 14,
  Color: 14,
  Balayage: 11,
  Facial: 10,
  Manicure: 10,
  Massage: 9,
  Gloss: 8,
  Pedicure: 8,
  Waxing: 8,
  Keratin: 5,
};

function pickServices(): string[] {
  const count = randInt(1, 4);
  const chosen: string[] = [];
  while (chosen.length < count) {
    const options = Object.entries(SERVICE_WEIGHTS).filter(([name]) => !chosen.includes(name));
    const total = options.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = random() * total;
    for (const [name, weight] of options) {
      roll -= weight;
      if (roll < 0) {
        chosen.push(name);
        break;
      }
    }
  }
  return chosen;
}

// Copied exactly from the brief.
const BRIEF_ROWS: Client[] = [
  {
    id: "c001", first_name: "Priya", last_name: "Shah", phone: "+15125550101", email: "priya@example.com",
    sms_opt_in: true, email_opt_in: true, first_visit: "2023-02-14", last_visit: "2026-10-02",
    total_visits: 18, total_spend_usd: 2140, services: ["Balayage", "Haircut", "Gloss"],
    next_appointment: "2026-11-06", birthday: "1991-03-22",
  },
  {
    id: "c002", first_name: "Maria", last_name: "Lopez", phone: "+15125550102",
    sms_opt_in: true, email_opt_in: false, first_visit: "2025-06-01", last_visit: "2026-05-19",
    total_visits: 4, total_spend_usd: 380, services: ["Haircut", "Blowout"], birthday: "1988-11-04",
  },
  {
    id: "c003", first_name: "Jordan", last_name: "Lee", email: "jordan@example.com",
    sms_opt_in: false, email_opt_in: true, first_visit: "2026-09-20", last_visit: "2026-09-20",
    total_visits: 1, total_spend_usd: 95, services: ["Facial"], birthday: "1997-07-30",
  },
  {
    id: "c004", first_name: "Aisha", last_name: "Khan", phone: "+15125550104", email: "aisha@example.com",
    sms_opt_in: true, email_opt_in: true, first_visit: "2022-08-11", last_visit: "2026-10-18",
    total_visits: 31, total_spend_usd: 4620, services: ["Keratin", "Haircut", "Manicure"],
    next_appointment: "2026-10-30", birthday: "1985-12-09",
  },
  {
    id: "c005", first_name: "Emily", last_name: "Chen", phone: "+15125550105", email: "emily@example.com",
    sms_opt_in: false, email_opt_in: false, first_visit: "2024-01-05", last_visit: "2025-12-12",
    total_visits: 6, total_spend_usd: 510, services: ["Massage", "Facial"], birthday: "1993-10-28",
  },
];

// A few generated clients who can't be reached on either channel.
const UNREACHABLE: Record<number, Partial<Client>> = {
  23: { sms_opt_in: false, email_opt_in: false },
  71: { phone: undefined, email_opt_in: false },
  118: { email: undefined, sms_opt_in: false },
  164: { phone: undefined, email: undefined },
};

const usedEmails = new Set(BRIEF_ROWS.map((c) => c.email));

function makeEmail(first: string, last: string): string {
  const base = `${first}.${last}`.toLowerCase().normalize("NFD").replace(/[^a-z.]/g, "");
  let email = `${base}@example.com`;
  for (let n = 2; usedEmails.has(email); n++) email = `${base}${n}@example.com`;
  usedEmails.add(email);
  return email;
}

function makeClient(index: number): Client {
  const first_name = pick(FIRST_NAMES);
  const last_name = pick(LAST_NAMES);

  // Visit history by archetype: new, lapsed or regular. Odds are tuned for SEED to hit the target group sizes.
  const roll = random();
  const isNew = roll < 0.08;
  const isLapsed = !isNew && roll < 0.21;
  const isBigSpender = !isNew && chance(0.11);

  let firstVisitAgo: number;
  let lastVisitAgo: number;
  if (isNew) {
    firstVisitAgo = randInt(1, 29);
    lastVisitAgo = chance(0.7) ? firstVisitAgo : randInt(0, firstVisitAgo - 1);
  } else if (isLapsed) {
    lastVisitAgo = randInt(95, 720);
    firstVisitAgo = lastVisitAgo + randInt(0, 1500);
  } else {
    lastVisitAgo = randInt(1, 85);
    firstVisitAgo = lastVisitAgo + randInt(30, 2000);
  }

  let total_visits: number;
  let total_spend_usd: number;
  if (isNew) {
    total_visits = lastVisitAgo === firstVisitAgo ? 1 : 2;
    total_spend_usd = total_visits * randInt(45, 180);
  } else if (isBigSpender) {
    total_visits = randInt(12, 40);
    total_spend_usd = randInt(1050, 5500);
  } else {
    const maxVisits = Math.max(2, Math.min(24, Math.floor((firstVisitAgo - lastVisitAgo) / 45) + 1));
    total_visits = randInt(1, maxVisits);
    total_spend_usd = Math.min(total_visits * randInt(45, 140), randInt(700, 980));
  }

  // About 30% overall have something booked; lapsed clients rarely do.
  const hasAppointment = chance(isLapsed ? 0.03 : 0.38);

  const birthYear = randInt(1960, 2005);
  const birthday = `${birthYear}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`;

  const client: Client = {
    id: `c${String(index + 1).padStart(3, "0")}`,
    first_name,
    last_name,
    phone: chance(0.06) ? undefined : `+1512555${String(100 + index + 1).padStart(4, "0")}`,
    email: chance(0.08) ? undefined : makeEmail(first_name, last_name),
    sms_opt_in: !chance(0.09),
    email_opt_in: !chance(0.1),
    first_visit: daysAgo(firstVisitAgo),
    last_visit: daysAgo(lastVisitAgo),
    total_visits,
    total_spend_usd,
    services: pickServices(),
    next_appointment: hasAppointment ? daysFromNow(randInt(1, 60)) : undefined,
    birthday,
  };

  return { ...client, ...UNREACHABLE[index] };
}

const clients: Client[] = [...BRIEF_ROWS];
for (let i = BRIEF_ROWS.length; i < TOTAL; i++) clients.push(makeClient(i));

mkdirSync(dirname(OUTPUT), { recursive: true });
// JSON.stringify drops undefined keys, so missing phone/email/appointment are omitted.
writeFileSync(OUTPUT, JSON.stringify(clients, null, 2) + "\n");

// Summary so the group sizes can be checked.
const currentMonth = now.getMonth() + 1;
const canText = (c: Client) => Boolean(c.phone) && c.sms_opt_in;
const canEmail = (c: Client) => Boolean(c.email) && c.email_opt_in;
const groups: [string, (c: Client) => boolean][] = [
  ["Last visit more than 90 days ago", (c) => daysSince(c.last_visit) > 90],
  ["First visit less than 30 days ago", (c) => daysSince(c.first_visit) < 30],
  ["Total spend more than $1,000", (c) => c.total_spend_usd > 1000],
  [`Birthday this month (${currentMonth})`, (c) => Number(c.birthday.slice(5, 7)) === currentMonth],
  ["No next appointment", (c) => !c.next_appointment],
  ["Booked Balayage", (c) => c.services.includes("Balayage")],
  ["No email", (c) => !c.email],
  ["No phone", (c) => !c.phone],
  ["SMS opted out", (c) => !c.sms_opt_in],
  ["Email opted out", (c) => !c.email_opt_in],
  ["Can get a text", canText],
  ["Can get an email", canEmail],
  ["Reachable on neither channel", (c) => !canText(c) && !canEmail(c)],
];

console.log(`Wrote ${clients.length} clients to ${OUTPUT} (today: ${toDate(today)})\n`);
for (const [label, test] of groups) {
  const count = clients.filter(test).length;
  const pct = ((count / clients.length) * 100).toFixed(1);
  console.log(`${label.padEnd(36)} ${String(count).padStart(4)}  ${pct.padStart(5)}%`);
}
console.log("\nClients per service:");
for (const service of Object.keys(SERVICE_WEIGHTS)) {
  console.log(`  ${service.padEnd(10)} ${clients.filter((c) => c.services.includes(service)).length}`);
}
