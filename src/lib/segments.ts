/** Looking up and naming segments. Pure functions, no React. */
import { PRESET_SEGMENTS } from "@/data/presetSegments";
import type { Segment } from "@/types";

/** The "Clients born in <month>" preset for today's month. */
export function birthdayMonthSegmentId(today: Date): string {
  return `birthday-month-${today.getMonth() + 1}`;
}

/** "  VIP   Clients " -> "vip clients". For duplicate checks only. */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Preset segments first, then saved ones. */
export function getAllSegments(savedSegments: readonly Segment[]): Segment[] {
  return [...PRESET_SEGMENTS, ...savedSegments];
}

export function findSegment(id: string, savedSegments: readonly Segment[]): Segment | undefined {
  return getAllSegments(savedSegments).find((segment) => segment.id === id);
}

/** True if any preset or saved segment already has this name, ignoring case and spacing. */
export function isNameTaken(name: string, savedSegments: readonly Segment[]): boolean {
  const wanted = normalizeName(name);
  return getAllSegments(savedSegments).some((segment) => normalizeName(segment.name) === wanted);
}

export type SegmentSections = { saved: Segment[]; birthdays: Segment[]; others: Segment[] };

/** The "Choose a group" menu: saved groups, then the other presets, then birthday groups. */
export function segmentSections(savedSegments: readonly Segment[]): SegmentSections {
  const isBirthday = (segment: Segment) => segment.id.startsWith("birthday-month-");
  return {
    saved: [...savedSegments],
    birthdays: PRESET_SEGMENTS.filter(isBirthday),
    others: PRESET_SEGMENTS.filter((segment) => !isBirthday(segment)),
  };
}
