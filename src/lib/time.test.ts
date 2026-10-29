import { describe, expect, it } from "vitest";
import {
  formatSendTime,
  getDefaultScheduleWallClock,
  getMinScheduleWallClock,
  isoToSalonWallClock,
  salonTimeZoneName,
  salonWallClockToIso,
  validateSchedule,
} from "./time";

/** Oct 29, 2026, 10:02:30 AM in Austin (CDT, UTC-5). */
const NOW = new Date("2026-10-29T15:02:30.000Z");

describe("formatSendTime", () => {
  it("says Now", () => {
    expect(formatSendTime({ mode: "now" })).toBe("Now");
  });

  it.each([
    ["2026-11-03T16:00:00.000Z", "Nov 03, 2026 @ 10:00 AM"],
    ["2026-12-25T15:05:00.000Z", "Dec 25, 2026 @ 9:05 AM"],
    ["2026-11-03T18:00:00.000Z", "Nov 03, 2026 @ 12:00 PM"],
    ["2026-11-04T06:00:00.000Z", "Nov 04, 2026 @ 12:00 AM"],
    ["2026-10-29T22:30:00.000Z", "Oct 29, 2026 @ 5:30 PM"],
  ])("shows %s in salon time as %j", (iso, text) => {
    expect(formatSendTime({ mode: "scheduled", iso })).toBe(text);
  });
});

describe("salonTimeZoneName", () => {
  it("is the generic name, without daylight saving", () => {
    expect(salonTimeZoneName()).toBe("Central Time");
  });
});

describe("wall clock conversions", () => {
  it("uses UTC-5 before the change and UTC-6 after it", () => {
    expect(salonWallClockToIso("2026-10-29T10:00")).toBe("2026-10-29T15:00:00.000Z");
    expect(salonWallClockToIso("2026-11-03T10:00")).toBe("2026-11-03T16:00:00.000Z");
    expect(isoToSalonWallClock("2026-10-29T15:00:00.000Z")).toBe("2026-10-29T10:00");
    expect(isoToSalonWallClock("2026-11-03T16:00:00.000Z")).toBe("2026-11-03T10:00");
  });

  it("shows both 1:30 AMs on Nov 1 as the same wall clock", () => {
    expect(isoToSalonWallClock("2026-11-01T06:30:00.000Z")).toBe("2026-11-01T01:30");
    expect(isoToSalonWallClock("2026-11-01T07:30:00.000Z")).toBe("2026-11-01T01:30");
  });

  it("picks the second, standard time 1:30 AM on Nov 1", () => {
    expect(salonWallClockToIso("2026-11-01T01:30")).toBe("2026-11-01T07:30:00.000Z");
  });

  it("round trips an instant through the wall clock", () => {
    for (const iso of [
      "2026-10-29T15:00:00.000Z",
      "2026-11-01T05:59:00.000Z",
      "2026-11-01T07:30:00.000Z",
      "2026-11-03T16:00:00.000Z",
    ]) {
      expect(salonWallClockToIso(isoToSalonWallClock(iso))).toBe(iso);
    }
  });

  it.each(["", "garbage", "2026-02-30T10:00", "2026-11-03T25:00", "2026-11-03 10:00", "2027-03-14T02:30"])(
    "rejects %j",
    (wallClock) => {
      expect(salonWallClockToIso(wallClock)).toBeNull();
    },
  );
});

describe("schedule defaults", () => {
  it("defaults to the next 5-minute mark at least 5 minutes away", () => {
    // 10:02:30 + 5 min = 10:07:30, rounded up to 10:10.
    expect(getDefaultScheduleWallClock(NOW)).toBe("2026-10-29T10:10");
  });

  it("keeps a time already on a 5-minute mark", () => {
    expect(getDefaultScheduleWallClock(new Date("2026-10-29T15:00:00.000Z"))).toBe(
      "2026-10-29T10:05",
    );
  });

  it("rolls over midnight in salon time", () => {
    // 11:58 PM in Austin on Nov 3.
    expect(getDefaultScheduleWallClock(new Date("2026-11-04T05:58:00.000Z"))).toBe(
      "2026-11-04T00:05",
    );
  });

  it("sets the minimum 5 minutes ahead, rounded up to the minute", () => {
    expect(getMinScheduleWallClock(NOW)).toBe("2026-10-29T10:08");
    expect(getMinScheduleWallClock(new Date("2026-10-29T15:00:00.000Z"))).toBe(
      "2026-10-29T10:05",
    );
  });
});

describe("validateSchedule", () => {
  it("rejects an empty value", () => {
    expect(validateSchedule("", NOW)).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects a time that does not exist", () => {
    expect(validateSchedule("2026-02-30T10:00", NOW)).toEqual({ ok: false, reason: "invalid" });
  });

  it.each(["2026-10-28T10:00", "2026-10-29T10:02", "2026-10-29T10:04", "2026-10-29T10:07"])(
    "rejects %s as too soon",
    (wallClock) => {
      expect(validateSchedule(wallClock, NOW)).toEqual({ ok: false, reason: "too-soon" });
    },
  );

  it("accepts the minimum the picker allows", () => {
    expect(validateSchedule(getMinScheduleWallClock(NOW), NOW)).toEqual({
      ok: true,
      iso: "2026-10-29T15:08:00.000Z",
    });
  });

  it("accepts the default", () => {
    expect(validateSchedule(getDefaultScheduleWallClock(NOW), NOW).ok).toBe(true);
  });

  it("accepts a time after the clocks change", () => {
    expect(validateSchedule("2026-11-03T10:00", NOW)).toEqual({
      ok: true,
      iso: "2026-11-03T16:00:00.000Z",
    });
  });
});
