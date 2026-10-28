import type { Channel, Filter } from "@/types";

export type FilterField = Filter["field"];
export type FilterOp = Filter["op"];
export type FilterValue = number | readonly string[] | readonly number[];

export type FilterAction =
  | { type: "add"; field: FilterField; id: string; today: Date }
  | { type: "remove"; id: string }
  | { type: "setOperator"; id: string; op: FilterOp }
  | { type: "setValue"; id: string; value: FilterValue }
  | { type: "clearAll" };

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

export function createFilter(field: FilterField, id: string, today: Date): Filter {
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
function withOperator(filter: Filter, op: FilterOp): Filter {
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
function withValue(filter: Filter, value: FilterValue): Filter {
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

export function filterReducer(filters: Filter[], action: FilterAction): Filter[] {
  switch (action.type) {
    case "add":
      return [...filters, createFilter(action.field, action.id, action.today)];
    case "remove":
      return filters.filter((filter) => filter.id !== action.id);
    case "setOperator":
      return filters.map((filter) =>
        filter.id === action.id ? withOperator(filter, action.op) : filter,
      );
    case "setValue":
      return filters.map((filter) =>
        filter.id === action.id ? withValue(filter, action.value) : filter,
      );
    case "clearAll":
      return [];
  }
}
