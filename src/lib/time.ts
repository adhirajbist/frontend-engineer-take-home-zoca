/**
 * Send times. Stored as ISO instants, shown and picked in the device's time
 * zone. Callers pass `now`, nothing here reads the clock. Every function takes
 * the zone as its last argument (default: the device's), so tests can fix it.
 */
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { SendTime } from "@/types";

/** The device's IANA zone, e.g. "America/Chicago". */
export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** A scheduled send must be at least this far ahead, so the owner can still launch it. */
export const MIN_LEAD_MINUTES = 5;

/** The default schedule time is rounded up to a multiple of this. */
const ROUND_TO_MINUTES = 5;

const MINUTE_MS = 60_000;

/** The format of <input type="datetime-local">, e.g. "2026-11-03T10:00". */
const WALL_CLOCK_FORMAT = "yyyy-MM-dd'T'HH:mm";
const WALL_CLOCK_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** "Now", or the local time like "Nov 03, 2026 @ 10:00 AM". */
export function formatSendTime(sendTime: SendTime, timeZone = deviceTimeZone()): string {
  if (sendTime.mode === "now") return "Now";
  return formatInTimeZone(sendTime.iso, timeZone, "MMM dd, yyyy '@' h:mm a");
}

/** "2026-11-03T16:00:00.000Z" -> "2026-11-03T10:00" (in Chicago; minutes only). */
export function isoToWallClock(iso: string, timeZone = deviceTimeZone()): string {
  return formatInTimeZone(iso, timeZone, WALL_CLOCK_FORMAT);
}

/**
 * "2026-11-03T10:00" (in Chicago) -> "2026-11-03T16:00:00.000Z".
 * Null if it is not a real local time, e.g. Feb 30 or 2:30 AM on the night
 * clocks spring forward. In the repeated hour when clocks fall back, the
 * second (standard time) one is used.
 */
export function wallClockToIso(wallClock: string, timeZone = deviceTimeZone()): string | null {
  if (!WALL_CLOCK_PATTERN.test(wallClock)) return null;
  const date = fromZonedTime(wallClock, timeZone);
  if (Number.isNaN(date.getTime())) return null;
  const iso = date.toISOString();
  return isoToWallClock(iso, timeZone) === wallClock ? iso : null;
}

/** The earliest allowed instant, rounded up to a whole number of `minutes`. */
function earliestAllowed(now: Date, minutes: number): Date {
  const earliest = now.getTime() + MIN_LEAD_MINUTES * MINUTE_MS;
  const step = minutes * MINUTE_MS;
  return new Date(Math.ceil(earliest / step) * step);
}

/** Prefill for the picker: at least MIN_LEAD_MINUTES ahead, on a 5-minute mark. */
export function getDefaultScheduleWallClock(now: Date, timeZone = deviceTimeZone()): string {
  return isoToWallClock(earliestAllowed(now, ROUND_TO_MINUTES).toISOString(), timeZone);
}

/**
 * The picker's min. Rounded up to the next whole minute, so the time it
 * allows always passes validateSchedule.
 */
export function getMinScheduleWallClock(now: Date, timeZone = deviceTimeZone()): string {
  return isoToWallClock(earliestAllowed(now, 1).toISOString(), timeZone);
}

export type ScheduleCheck =
  | { ok: true; iso: string }
  | { ok: false; reason: "empty" | "invalid" | "too-soon" };

/** Checks a picked local time against `now`. */
export function validateSchedule(
  wallClock: string,
  now: Date,
  timeZone = deviceTimeZone(),
): ScheduleCheck {
  if (wallClock.trim() === "") return { ok: false, reason: "empty" };
  const iso = wallClockToIso(wallClock, timeZone);
  if (!iso) return { ok: false, reason: "invalid" };
  const earliest = now.getTime() + MIN_LEAD_MINUTES * MINUTE_MS;
  if (new Date(iso).getTime() < earliest) return { ok: false, reason: "too-soon" };
  return { ok: true, iso };
}
