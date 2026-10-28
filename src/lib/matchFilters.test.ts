import { describe, expect, it } from "vitest";
import type { Client, Filter } from "@/types";
import { canEmail, canText, filterClients, matchesFilter } from "./matchFilters";

/** Filter without its id, kept per field. */
type FilterInput = Filter extends infer F ? (F extends Filter ? Omit<F, "id"> : never) : never;

const TODAY = new Date(2026, 9, 28); // 28 Oct 2026, local time

function client(overrides: Partial<Client> = {}): Client {
  return {
    id: "c1",
    first_name: "Ana",
    last_name: "Diaz",
    phone: "+15125550101",
    email: "ana@example.com",
    sms_opt_in: true,
    email_opt_in: true,
    first_visit: "2024-01-10",
    last_visit: "2026-10-01",
    total_visits: 5,
    total_spend_usd: 1000,
    services: ["Haircut"],
    birthday: "1990-03-15",
    ...overrides,
  };
}

function matches(c: Client, filter: FilterInput): boolean {
  return matchesFilter(c, { id: "f1", ...filter }, TODAY);
}

describe("canText / canEmail", () => {
  it("needs opt-in and a phone to text", () => {
    expect(canText(client())).toBe(true);
    expect(canText(client({ sms_opt_in: false }))).toBe(false);
    expect(canText(client({ phone: undefined }))).toBe(false);
  });

  it("needs opt-in and an email to mail", () => {
    expect(canEmail(client())).toBe(true);
    expect(canEmail(client({ email_opt_in: false }))).toBe(false);
    expect(canEmail(client({ email: undefined }))).toBe(false);
  });
});

describe.each([
  ["lastVisit", "last_visit"],
  ["firstVisit", "first_visit"],
] as const)("%s", (field, key) => {
  const tenDaysAgo = client({ [key]: "2026-10-18" });

  it("lessThan matches fewer than N days ago", () => {
    expect(matches(tenDaysAgo, { field, op: "lessThan", days: 11 })).toBe(true);
    expect(matches(tenDaysAgo, { field, op: "lessThan", days: 9 })).toBe(false);
  });

  it("moreThan matches more than N days ago", () => {
    expect(matches(tenDaysAgo, { field, op: "moreThan", days: 9 })).toBe(true);
    expect(matches(tenDaysAgo, { field, op: "moreThan", days: 11 })).toBe(false);
  });

  it("exactly N days matches neither", () => {
    expect(matches(tenDaysAgo, { field, op: "lessThan", days: 10 })).toBe(false);
    expect(matches(tenDaysAgo, { field, op: "moreThan", days: 10 })).toBe(false);
  });

  it("counts calendar days, not 24 hour blocks", () => {
    const yesterday = client({ [key]: "2026-10-27" });
    const lateToday = new Date(2026, 9, 28, 0, 5);
    const filter: Filter = { id: "f1", field, op: "lessThan", days: 1 };
    expect(matchesFilter(yesterday, filter, lateToday)).toBe(false);
  });
});

describe("nextAppointment", () => {
  const inTen = client({ next_appointment: "2026-11-07" });
  const noAppointment = client({ next_appointment: undefined });
  const past = client({ next_appointment: "2026-10-20" });
  const today = client({ next_appointment: "2026-10-28" });

  it("none matches no appointment or a past one", () => {
    expect(matches(noAppointment, { field: "nextAppointment", op: "none" })).toBe(true);
    expect(matches(past, { field: "nextAppointment", op: "none" })).toBe(true);
    expect(matches(inTen, { field: "nextAppointment", op: "none" })).toBe(false);
    expect(matches(today, { field: "nextAppointment", op: "none" })).toBe(false);
  });

  it("lessThan matches upcoming within N days", () => {
    expect(matches(inTen, { field: "nextAppointment", op: "lessThan", days: 11 })).toBe(true);
    expect(matches(inTen, { field: "nextAppointment", op: "lessThan", days: 10 })).toBe(false);
    expect(matches(today, { field: "nextAppointment", op: "lessThan", days: 1 })).toBe(true);
  });

  it("moreThan matches more than N days from now", () => {
    expect(matches(inTen, { field: "nextAppointment", op: "moreThan", days: 9 })).toBe(true);
    expect(matches(inTen, { field: "nextAppointment", op: "moreThan", days: 10 })).toBe(false);
  });

  it("no upcoming appointment never matches lessThan or moreThan", () => {
    for (const c of [noAppointment, past]) {
      expect(matches(c, { field: "nextAppointment", op: "lessThan", days: 999 })).toBe(false);
      expect(matches(c, { field: "nextAppointment", op: "moreThan", days: 0 })).toBe(false);
    }
  });
});

describe("totalVisits and totalSpend", () => {
  const c = client({ total_visits: 5, total_spend_usd: 1000 });

  it("compares visits strictly", () => {
    expect(matches(c, { field: "totalVisits", op: "moreThan", count: 4 })).toBe(true);
    expect(matches(c, { field: "totalVisits", op: "moreThan", count: 5 })).toBe(false);
    expect(matches(c, { field: "totalVisits", op: "lessThan", count: 6 })).toBe(true);
    expect(matches(c, { field: "totalVisits", op: "lessThan", count: 5 })).toBe(false);
  });

  it("compares spend strictly", () => {
    expect(matches(c, { field: "totalSpend", op: "moreThan", amount: 999 })).toBe(true);
    expect(matches(c, { field: "totalSpend", op: "moreThan", amount: 1000 })).toBe(false);
    expect(matches(c, { field: "totalSpend", op: "lessThan", amount: 1001 })).toBe(true);
    expect(matches(c, { field: "totalSpend", op: "lessThan", amount: 1000 })).toBe(false);
  });
});

describe("services", () => {
  const c = client({ services: ["Haircut", "Color"] });

  it("includes matches any listed service", () => {
    expect(matches(c, { field: "services", op: "includes", services: ["Balayage", "Color"] })).toBe(true);
    expect(matches(c, { field: "services", op: "includes", services: ["Balayage"] })).toBe(false);
  });

  it("excludes matches none of the listed services", () => {
    expect(matches(c, { field: "services", op: "excludes", services: ["Balayage"] })).toBe(true);
    expect(matches(c, { field: "services", op: "excludes", services: ["Balayage", "Color"] })).toBe(false);
  });
});

describe("birthday", () => {
  const march = client({ birthday: "1990-03-15" });

  it("in matches a listed month", () => {
    expect(matches(march, { field: "birthday", op: "in", months: [3, 4] })).toBe(true);
    expect(matches(march, { field: "birthday", op: "in", months: [4] })).toBe(false);
  });

  it("notIn matches an unlisted month", () => {
    expect(matches(march, { field: "birthday", op: "notIn", months: [4] })).toBe(true);
    expect(matches(march, { field: "birthday", op: "notIn", months: [3] })).toBe(false);
  });
});

describe("channel", () => {
  const textOnly = client({ email_opt_in: false });
  const noPhone = client({ phone: undefined, email_opt_in: false });

  it("includes matches anyone reachable by a listed channel", () => {
    expect(matches(textOnly, { field: "channel", op: "includes", channels: ["sms"] })).toBe(true);
    expect(matches(textOnly, { field: "channel", op: "includes", channels: ["email"] })).toBe(false);
    expect(matches(textOnly, { field: "channel", op: "includes", channels: ["sms", "email"] })).toBe(true);
  });

  it("does not count a missing phone or an opt-out as reachable", () => {
    expect(matches(noPhone, { field: "channel", op: "includes", channels: ["sms"] })).toBe(false);
    expect(matches(textOnly, { field: "channel", op: "includes", channels: ["email"] })).toBe(false);
  });

  it("excludes matches anyone reachable by none of them", () => {
    expect(matches(noPhone, { field: "channel", op: "excludes", channels: ["sms", "email"] })).toBe(true);
    expect(matches(textOnly, { field: "channel", op: "excludes", channels: ["sms"] })).toBe(false);
  });
});

describe("filterClients", () => {
  const loyal = client({ id: "a", total_visits: 20, services: ["Balayage"] });
  const newbie = client({ id: "b", total_visits: 1, services: ["Balayage"] });
  const other = client({ id: "c", total_visits: 20, services: ["Haircut"] });
  const all = [loyal, newbie, other];

  it("returns everyone when there are no filters", () => {
    expect(filterClients(all, [], TODAY)).toEqual(all);
  });

  it("combines filters with AND", () => {
    const filters: Filter[] = [
      { id: "1", field: "totalVisits", op: "moreThan", count: 5 },
      { id: "2", field: "services", op: "includes", services: ["Balayage"] },
    ];
    expect(filterClients(all, filters, TODAY)).toEqual([loyal]);
  });

  it("supports a range from two filters on the same field", () => {
    const filters: Filter[] = [
      { id: "1", field: "totalVisits", op: "moreThan", count: 0 },
      { id: "2", field: "totalVisits", op: "lessThan", count: 10 },
    ];
    expect(filterClients(all, filters, TODAY)).toEqual([newbie]);
  });
});
