import { describe, expect, it } from "vitest";
import type { Client, Segment } from "@/types";
import { getAudienceStats, getReachableCount } from "./reach";

const TODAY = new Date(2026, 9, 28);

function client(id: string, overrides: Partial<Client> = {}): Client {
  return {
    id,
    first_name: "Ana",
    last_name: "Diaz",
    phone: "+15125550101",
    email: "ana@example.com",
    sms_opt_in: true,
    email_opt_in: true,
    first_visit: "2024-01-10",
    last_visit: "2026-10-01",
    total_visits: 12,
    total_spend_usd: 1000,
    services: ["Haircut"],
    birthday: "1990-03-15",
    ...overrides,
  };
}

const CLIENTS = [
  client("both"),
  client("text-only", { email: undefined }),
  client("email-only", { sms_opt_in: false }),
  client("neither", { phone: undefined, email_opt_in: false }),
  client("not-a-vip", { total_visits: 2 }),
];

const VIP: Segment = {
  id: "vip",
  name: "VIP",
  filters: [{ id: "f1", field: "totalVisits", op: "moreThan", count: 10 }],
};

describe("getAudienceStats", () => {
  it("counts reachable clients within the group only", () => {
    expect(getAudienceStats(VIP, CLIENTS, TODAY)).toEqual({ matching: 4, texted: 2, mailed: 2 });
  });

  it("counts everyone when there are no filters", () => {
    const all: Segment = { id: "all", name: "All", filters: [] };
    expect(getAudienceStats(all, CLIENTS, TODAY)).toEqual({ matching: 5, texted: 3, mailed: 3 });
  });
});

describe("getReachableCount", () => {
  it("counts a client reachable both ways once", () => {
    // both, text-only and email-only. Not the 2 + 2 of the stats.
    expect(getReachableCount(VIP, CLIENTS, ["sms", "email"], TODAY)).toBe(3);
  });

  it("counts one channel only", () => {
    expect(getReachableCount(VIP, CLIENTS, ["sms"], TODAY)).toBe(2);
    expect(getReachableCount(VIP, CLIENTS, ["email"], TODAY)).toBe(2);
  });

  it("is 0 when nobody can be reached that way", () => {
    const neither: Segment = {
      id: "neither",
      name: "Neither",
      filters: [{ id: "f1", field: "channel", op: "excludes", channels: ["sms", "email"] }],
    };
    expect(getReachableCount(neither, CLIENTS, ["sms", "email"], TODAY)).toBe(0);
    expect(getReachableCount(VIP, CLIENTS, [], TODAY)).toBe(0);
  });
});
