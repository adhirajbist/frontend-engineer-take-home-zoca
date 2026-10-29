import { createFilter, MONTH_NAMES } from "@/lib/filters";
import type { Segment } from "@/types";

/** Ids look like "preset-lapsed-90-0": the segment id, then the filter's position. */
function filterId(segmentId: string, index: number): string {
  return `preset-${segmentId}-${index}`;
}

const birthdaySegments: Segment[] = MONTH_NAMES.map((monthName, index) => {
  const id = `birthday-month-${index + 1}`;
  return {
    id,
    name: `Clients born in ${monthName}`,
    filters: [createFilter("birthday", { id: filterId(id, 0), op: "in", value: [index + 1] })],
  };
});

/** No filters, so it's also where "Clear all" lands. */
export const ALL_CLIENTS: Segment = { id: "all-clients", name: "All clients", filters: [] };

/** Ready-made groups every salon gets. Fixed ids, so campaigns can point at them. */
export const PRESET_SEGMENTS: readonly Segment[] = [
  ALL_CLIENTS,
  {
    id: "new-clients-30d",
    name: "New clients (last 30 days)",
    filters: [
      createFilter("firstVisit", { id: filterId("new-clients-30d", 0), op: "lessThan", value: 30 }),
    ],
  },
  {
    id: "lapsed-90",
    name: "Lapsed 90+ days",
    filters: [
      createFilter("lastVisit", { id: filterId("lapsed-90", 0), op: "moreThan", value: 90 }),
    ],
  },
  {
    id: "vip",
    name: "VIP",
    filters: [createFilter("totalVisits", { id: filterId("vip", 0), op: "moreThan", value: 10 })],
  },
  {
    id: "vip-no-next-appointment",
    name: "VIP with next appointment not booked",
    filters: [
      createFilter("nextAppointment", { id: filterId("vip-no-next-appointment", 0), op: "none" }),
      createFilter("totalVisits", {
        id: filterId("vip-no-next-appointment", 1),
        op: "moreThan",
        value: 10,
      }),
    ],
  },
  ...birthdaySegments,
];
