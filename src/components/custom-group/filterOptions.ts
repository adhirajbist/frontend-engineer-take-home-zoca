import clients from "@/data/clients.json";
import type { FilterField, FilterOp } from "@/lib/filterReducer";
import type { Channel } from "@/types";

/** Order shown in the "+ Filter" menu. */
export const FIELD_ORDER: FilterField[] = [
  "lastVisit",
  "firstVisit",
  "nextAppointment",
  "totalVisits",
  "totalSpend",
  "services",
  "birthday",
  "channel",
];

export const FIELD_LABELS: Record<FilterField, string> = {
  lastVisit: "Last visit",
  firstVisit: "First visit",
  nextAppointment: "Next appointment",
  totalVisits: "Total visits",
  totalSpend: "Total spend",
  services: "Services booked",
  birthday: "Birthday",
  channel: "Channel",
};

export const OPERATOR_LABELS: Record<FilterOp, string> = {
  lessThan: "less than",
  moreThan: "more than",
  none: "none booked",
  includes: "includes",
  excludes: "excludes",
  in: "in",
  notIn: "not in",
};

export const SERVICE_OPTIONS = [...new Set(clients.flatMap((client) => client.services))]
  .sort()
  .map((service) => ({ value: service, label: service }));

export const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((label, index) => ({ value: index + 1, label }));

export const CHANNEL_OPTIONS: { value: Channel; label: string }[] = [
  { value: "sms", label: "Text" },
  { value: "email", label: "Email" },
];
