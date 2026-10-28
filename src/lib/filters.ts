/**
 * All filter logic in one place: creating, changing, describing, comparing
 * and matching filters. Pure functions, no React.
 */
import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Channel, Client, Filter } from "@/types";
import { formatCount } from "./format";

export type FilterField = Filter["field"];
export type FilterOp = Filter["op"];
export type FilterValue = number | readonly string[] | readonly number[];

export const FIELD_OPERATORS: Record<FilterField, FilterOp[]> = {
  lastVisit: ["lessThan", "moreThan"],
  firstVisit: ["lessThan", "moreThan"],
  nextAppointment: ["none", "lessThan", "moreThan"],
  totalVisits: ["lessThan", "moreThan"],
  totalSpend: ["lessThan", "moreThan"],
  services: ["includes", "excludes"],
  birthday: ["in", "notIn"],
  channel: ["includes", "excludes"],
};

/** Days used when Next appointment switches from "none booked" to a day operator. */
export const DEFAULT_APPOINTMENT_DAYS = 30;

/** Index 0 is January. Birthday filters store months as 1 to 12. */
export const MONTH_NAMES = [
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
];

export const CHANNEL_NAMES: Record<Channel, string> = { sms: "Text", email: "Email" };

// ---------------------------------------------------------------------------
// Creating and changing filters

let idCounter = 0;

/** Unique within the page and across reloads. Works without a secure context. */
export function newFilterId(): string {
  idCounter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `filter-${Date.now().toString(36)}-${idCounter.toString(36)}-${random}`;
}

export type FilterOverrides = {
  id?: string;
  op?: FilterOp;
  value?: FilterValue;
  /** Sets the birthday default month. Defaults to now. */
  today?: Date;
};

function defaultFilter(field: FilterField, id: string, today: Date): Filter {
  switch (field) {
    case "lastVisit":
      return { id, field, op: "moreThan", days: 90 };
    case "firstVisit":
      return { id, field, op: "lessThan", days: 30 };
    case "nextAppointment":
      return { id, field, op: "none" };
    case "totalVisits":
      return { id, field, op: "moreThan", count: 5 };
    case "totalSpend":
      return { id, field, op: "moreThan", amount: 1000 };
    case "services":
      return { id, field, op: "includes", services: ["Balayage"] };
    case "birthday":
      return { id, field, op: "in", months: [today.getMonth() + 1] };
    case "channel":
      return { id, field, op: "includes", channels: ["sms"] };
  }
}

/**
 * A valid filter for the field, starting from the "+ Filter" defaults.
 * An op or value that does not fit the field is ignored.
 */
export function createFilter(field: FilterField, overrides: FilterOverrides = {}): Filter {
  const { id = newFilterId(), op, value, today = new Date() } = overrides;
  let filter = defaultFilter(field, id, today);
  if (op !== undefined) filter = withOperator(filter, op);
  if (value !== undefined) filter = withValue(filter, value);
  return filter;
}

function isDayOp(op: FilterOp): op is "lessThan" | "moreThan" {
  return op === "lessThan" || op === "moreThan";
}

function isWholeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isNonEmptyList<T>(value: unknown, isItem: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.length > 0 && value.every(isItem);
}

function isString(item: unknown): item is string {
  return typeof item === "string";
}

function isMonth(item: unknown): item is number {
  return Number.isInteger(item) && Number(item) >= 1 && Number(item) <= 12;
}

function isChannel(item: unknown): item is Channel {
  return item === "sms" || item === "email";
}

/** Returns the filter with the new operator, or unchanged if the operator does not fit. */
export function withOperator(filter: Filter, op: FilterOp): Filter {
  if (!FIELD_OPERATORS[filter.field].includes(op)) return filter;
  switch (filter.field) {
    case "lastVisit":
    case "firstVisit":
    case "totalVisits":
    case "totalSpend":
      return isDayOp(op) ? { ...filter, op } : filter;
    case "nextAppointment": {
      const { id, field } = filter;
      if (op === "none") return { id, field, op };
      if (!isDayOp(op)) return filter;
      const days = filter.op === "none" ? DEFAULT_APPOINTMENT_DAYS : filter.days;
      return { id, field, op, days };
    }
    case "services":
    case "channel":
      return op === "includes" || op === "excludes" ? { ...filter, op } : filter;
    case "birthday":
      return op === "in" || op === "notIn" ? { ...filter, op } : filter;
  }
}

/** Returns the filter with the new value, or unchanged if the value is not valid. */
export function withValue(filter: Filter, value: FilterValue): Filter {
  switch (filter.field) {
    case "lastVisit":
    case "firstVisit":
      return isWholeNumber(value) ? { ...filter, days: value } : filter;
    case "nextAppointment":
      return filter.op !== "none" && isWholeNumber(value) ? { ...filter, days: value } : filter;
    case "totalVisits":
      return isWholeNumber(value) ? { ...filter, count: value } : filter;
    case "totalSpend":
      return isWholeNumber(value) ? { ...filter, amount: value } : filter;
    case "services":
      return isNonEmptyList(value, isString) ? { ...filter, services: [...value] } : filter;
    case "birthday":
      return isNonEmptyList(value, isMonth) ? { ...filter, months: [...value] } : filter;
    case "channel":
      return isNonEmptyList(value, isChannel) ? { ...filter, channels: [...value] } : filter;
  }
}

// ---------------------------------------------------------------------------
// Describing filters

function plural(n: number, one: string, many: string): string {
  return `${formatCount(n)} ${n === 1 ? one : many}`;
}

/** ["A"] -> "A", ["A", "B", "C"] -> "A, B or C". */
function orList(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}

const CHANNEL_PHRASES: Record<Channel, string> = { sms: "a text", email: "an email" };

/** A plain-language sentence, e.g. "Last visited more than 90 days ago". */
export function describeFilter(filter: Filter): string {
  switch (filter.field) {
    case "lastVisit":
    case "firstVisit": {
      const verb = filter.field === "lastVisit" ? "Last visited" : "First visited";
      const than = filter.op === "lessThan" ? "less than" : "more than";
      return `${verb} ${than} ${plural(filter.days, "day", "days")} ago`;
    }
    case "nextAppointment": {
      if (filter.op === "none") return "Has no appointment booked";
      const days = plural(filter.days, "day", "days");
      return filter.op === "lessThan"
        ? `Has an appointment in less than ${days}`
        : `Has an appointment more than ${days} from now`;
    }
    case "totalVisits": {
      const than = filter.op === "lessThan" ? "fewer than" : "more than";
      return `Visited ${than} ${plural(filter.count, "time", "times")}`;
    }
    case "totalSpend": {
      const than = filter.op === "lessThan" ? "less than" : "more than";
      return `Spent ${than} $${formatCount(filter.amount)}`;
    }
    case "services": {
      const verb = filter.op === "includes" ? "Booked" : "Never booked";
      return `${verb} ${orList(filter.services)}`;
    }
    case "birthday": {
      const months = orList(filter.months.map((month) => MONTH_NAMES[month - 1]));
      return filter.op === "in" ? `Birthday in ${months}` : `Birthday not in ${months}`;
    }
    case "channel": {
      const verb = filter.op === "includes" ? "Can get" : "Can’t get";
      return `${verb} ${orList(filter.channels.map((channel) => CHANNEL_PHRASES[channel]))}`;
    }
  }
}

// ---------------------------------------------------------------------------
// Copying and comparing filter lists

/** A deep copy of each filter with a fresh id. */
export function cloneFilters(filters: readonly Filter[]): Filter[] {
  return filters.map((filter) => ({ ...structuredClone(filter), id: newFilterId() }));
}

/** Same text for the same condition, whatever the id, key order or list order. */
function filterKey(filter: Filter): string {
  const { id, ...rest } = filter;
  void id;
  const entries = Object.entries(rest)
    .map(([key, value]): [string, unknown] => [
      key,
      Array.isArray(value) ? [...value].sort() : value,
    ])
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

/** True when both lists hold the same conditions, ignoring ids and order. */
export function filtersEqual(a: readonly Filter[], b: readonly Filter[]): boolean {
  if (a.length !== b.length) return false;
  const keysA = a.map(filterKey).sort();
  const keysB = b.map(filterKey).sort();
  return keysA.every((key, index) => key === keysB[index]);
}

// ---------------------------------------------------------------------------
// Matching clients

export function canText(client: Client): boolean {
  return client.sms_opt_in && Boolean(client.phone);
}

export function canEmail(client: Client): boolean {
  return client.email_opt_in && Boolean(client.email);
}

function canReach(client: Client, channel: Channel): boolean {
  return channel === "sms" ? canText(client) : canEmail(client);
}

/** Calendar days from date to today. Dates are "YYYY-MM-DD". */
function daysSince(date: string, today: Date): number {
  return differenceInCalendarDays(today, parseISO(date));
}

/** Strict: exactly n matches neither operator. */
function compare(op: "lessThan" | "moreThan", actual: number, n: number): boolean {
  return op === "lessThan" ? actual < n : actual > n;
}

/** Days until the next appointment, or null if none is booked from today on. */
function daysUntilAppointment(client: Client, today: Date): number | null {
  if (!client.next_appointment) return null;
  const days = -daysSince(client.next_appointment, today);
  return days < 0 ? null : days;
}

function birthMonth(client: Client): number {
  return Number(client.birthday.slice(5, 7));
}

export function matchesFilter(client: Client, filter: Filter, today: Date): boolean {
  switch (filter.field) {
    case "lastVisit":
      return compare(filter.op, daysSince(client.last_visit, today), filter.days);
    case "firstVisit":
      return compare(filter.op, daysSince(client.first_visit, today), filter.days);
    case "nextAppointment": {
      const days = daysUntilAppointment(client, today);
      if (filter.op === "none") return days === null;
      return days !== null && compare(filter.op, days, filter.days);
    }
    case "totalVisits":
      return compare(filter.op, client.total_visits, filter.count);
    case "totalSpend":
      return compare(filter.op, client.total_spend_usd, filter.amount);
    case "services": {
      const hasAny = filter.services.some((service) => client.services.includes(service));
      return filter.op === "includes" ? hasAny : !hasAny;
    }
    case "birthday": {
      const inList = filter.months.includes(birthMonth(client));
      return filter.op === "in" ? inList : !inList;
    }
    case "channel": {
      const reachable = filter.channels.some((channel) => canReach(client, channel));
      return filter.op === "includes" ? reachable : !reachable;
    }
  }
}

/** All filters must match. No filters means everyone. */
export function filterClients(clients: Client[], filters: Filter[], today: Date): Client[] {
  return clients.filter((client) =>
    filters.every((filter) => matchesFilter(client, filter, today)),
  );
}
