import { describe, expect, it } from "vitest";
import { PRESET_SEGMENTS } from "@/data/presetSegments";
import type { Segment } from "@/types";
import {
  birthdayMonthSegmentId,
  findSegment,
  getAllSegments,
  isNameTaken,
  normalizeName,
  segmentSections,
} from "./segments";

const SAVED: Segment[] = [{ id: "saved-1", name: "Balayage fans", filters: [] }];

describe("birthdayMonthSegmentId", () => {
  it("uses today's month", () => {
    expect(birthdayMonthSegmentId(new Date(2026, 0, 1))).toBe("birthday-month-1");
    expect(birthdayMonthSegmentId(new Date(2026, 11, 31))).toBe("birthday-month-12");
  });

  it("points at a preset that exists", () => {
    const id = birthdayMonthSegmentId(new Date(2026, 11, 31));
    expect(findSegment(id, [])?.name).toBe("Clients born in December");
  });
});

describe("normalizeName", () => {
  it("trims, collapses spaces and lowercases", () => {
    expect(normalizeName("  VIP   Clients\t ")).toBe("vip clients");
  });
});

describe("getAllSegments / findSegment", () => {
  it("lists presets first, then saved", () => {
    const all = getAllSegments(SAVED);
    expect(all.slice(0, PRESET_SEGMENTS.length)).toEqual(PRESET_SEGMENTS);
    expect(all[all.length - 1]).toBe(SAVED[0]);
  });

  it("finds presets and saved segments by id", () => {
    expect(findSegment("vip", SAVED)?.name).toBe("VIP");
    expect(findSegment("saved-1", SAVED)?.name).toBe("Balayage fans");
    expect(findSegment("nope", SAVED)).toBeUndefined();
  });
});

describe("isNameTaken", () => {
  it("matches preset and saved names ignoring case and spacing", () => {
    expect(isNameTaken("  all   CLIENTS ", SAVED)).toBe(true);
    expect(isNameTaken("balayage FANS", SAVED)).toBe(true);
    expect(isNameTaken("Color clients", SAVED)).toBe(false);
  });
});

describe("PRESET_SEGMENTS", () => {
  it("has unique segment ids and unique filter ids", () => {
    const ids = PRESET_SEGMENTS.map((segment) => segment.id);
    const filterIds = PRESET_SEGMENTS.flatMap((segment) => segment.filters.map((f) => f.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(filterIds).size).toBe(filterIds.length);
  });

  it("builds the expected filters with stable ids", () => {
    expect(findSegment("lapsed-90", [])?.filters).toEqual([
      { id: "preset-lapsed-90-0", field: "lastVisit", op: "moreThan", days: 90 },
    ]);
    expect(findSegment("vip-no-next-appointment", [])?.filters).toEqual([
      { id: "preset-vip-no-next-appointment-0", field: "nextAppointment", op: "none" },
      { id: "preset-vip-no-next-appointment-1", field: "totalVisits", op: "moreThan", count: 10 },
    ]);
    expect(findSegment("birthday-month-3", [])?.filters).toEqual([
      { id: "preset-birthday-month-3-0", field: "birthday", op: "in", months: [3] },
    ]);
  });
});

describe("segmentSections", () => {
  it("puts saved groups, then the 12 birthday groups, then the other presets", () => {
    const { saved, birthdays, others } = segmentSections(SAVED);
    expect(saved).toEqual(SAVED);
    expect(birthdays.map((s) => s.id)).toEqual(
      Array.from({ length: 12 }, (_, i) => `birthday-month-${i + 1}`),
    );
    expect(others.map((s) => s.id)).toEqual([
      "all-clients",
      "new-clients-30d",
      "lapsed-90",
      "vip",
      "vip-no-next-appointment",
    ]);
    expect(saved.length + birthdays.length + others.length).toBe(PRESET_SEGMENTS.length + 1);
  });
});
