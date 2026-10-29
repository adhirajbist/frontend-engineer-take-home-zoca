/**
 * Send times. Stored as ISO instants, shown and picked in the salon's own time
 * zone, whatever zone the owner's device is in. Pure functions: callers pass
 * `now`, nothing here reads the clock.
 */
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { SendTime } from "@/types";

/** Lumen Hair & Spa is in Austin, Texas. */
export const SALON_TIME_ZONE = "America/Chicago";

/** Shown with the zone name, e.g. "Central Time (Austin)". */
export const SALON_CITY = "Austin";

/** A scheduled send must be at least this far ahead, so the owner can still launch it. */
export const MIN_LEAD_MINUTES = 5;

/** The default schedule time is rounded up to a multiple of this. */
const ROUND_TO_MINUTES = 5;

const MINUTE_MS = 60_000;

/** The format of <input type="datetime-local">, e.g. "2026-11-03T10:00". */
const WALL_CLOCK_FORMAT = "yyyy-MM-dd'T'HH:mm";
const WALL_CLOCK_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** "Central Time". Same text in summer and winter. */
export function salonTimeZoneName(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIME_ZONE,
    timeZoneName: "longGeneric",
  }).formatToParts(new Date(0));
  return parts.find((part) => part.type === "timeZoneName")?.value ?? SALON_TIME_ZONE;
}

/** "Now", or the salon time like "Nov 03, 2026 @ 10:00 AM". */
export function formatSendTime(sendTime: SendTime): string {
  if (sendTime.mode === "now") return "Now";
  return formatInTimeZone(sendTime.iso, SALON_TIME_ZONE, "MMM dd, yyyy '@' h:mm a");
}

/** "2026-11-03T16:00:00.000Z" -> "2026-11-03T10:00" (salon time, minutes only). */
export function isoToSalonWallClock(iso: string): string {
  return formatInTimeZone(iso, SALON_TIME_ZONE, WALL_CLOCK_FORMAT);
}

/**
 * "2026-11-03T10:00" (salon time) -> "2026-11-03T16:00:00.000Z".
 * Null if it is not a real salon time, e.g. Feb 30 or 2:30 AM on the night
 * clocks spring forward. In the repeated hour when clocks fall back, the
 * second (standard time) one is used.
 */
export function salonWallClockToIso(wallClock: string): string | null {
  if (!WALL_CLOCK_PATTERN.test(wallClock)) return null;
  const date = fromZonedTime(wallClock, SALON_TIME_ZONE);
  if (Number.isNaN(date.getTime())) return null;
  const iso = date.toISOString();
  return isoToSalonWallClock(iso) === wallClock ? iso : null;
}

/** The earliest allowed instant, rounded up to a whole number of `minutes`. */
function earliestAllowed(now: Date, minutes: number): Date {
  const earliest = now.getTime() + MIN_LEAD_MINUTES * MINUTE_MS;
  const step = minutes * MINUTE_MS;
  return new Date(Math.ceil(earliest / step) * step);
}

/** Prefill for the picker: at least MIN_LEAD_MINUTES ahead, on a 5-minute mark. */
export function getDefaultScheduleWallClock(now: Date): string {
  return isoToSalonWallClock(earliestAllowed(now, ROUND_TO_MINUTES).toISOString());
}

/**
 * The picker's min. Rounded up to the next whole minute, so the time it
 * allows always passes validateSchedule.
 */
export function getMinScheduleWallClock(now: Date): string {
  return isoToSalonWallClock(earliestAllowed(now, 1).toISOString());
}

export type ScheduleCheck =
  | { ok: true; iso: string }
  | { ok: false; reason: "empty" | "invalid" | "too-soon" };

/** Checks a picked salon time against `now`. */
export function validateSchedule(wallClock: string, now: Date): ScheduleCheck {
  if (wallClock.trim() === "") return { ok: false, reason: "empty" };
  const iso = salonWallClockToIso(wallClock);
  if (!iso) return { ok: false, reason: "invalid" };
  const earliest = now.getTime() + MIN_LEAD_MINUTES * MINUTE_MS;
  if (new Date(iso).getTime() < earliest) return { ok: false, reason: "too-soon" };
  return { ok: true, iso };
}
