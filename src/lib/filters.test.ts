import { describe, expect, it } from "vitest";
import type { Filter } from "@/types";
import {
  DEFAULT_APPOINTMENT_DAYS,
  FIELD_OPERATORS,
  cloneFilters,
  createFilter,
  describeFilter,
  filtersEqual,
  newFilterId,
  withOperator,
  type FilterField,
} from "./filters";

/** Filter without its id, kept per field. */
type FilterInput = Filter extends infer F ? (F extends Filter ? Omit<F, "id"> : never) : never;

const TODAY = new Date(2026, 9, 28); // October

const FIELDS = Object.keys(FIELD_OPERATORS) as FilterField[];

function isWholeNumber(n: number): boolean {
  return Number.isSafeInteger(n) && n >= 0;
}

/** True when the filter has exactly the keys and values its field and operator need. */
function isValid(filter: Filter): boolean {
  if (!FIELD_OPERATORS[filter.field].includes(filter.op)) return false;
  const keys = Object.keys(filter).sort().join(",");
  switch (filter.field) {
    case "lastVisit":
    case "firstVisit":
      return keys === "days,field,id,op" && isWholeNumber(filter.days);
    case "nextAppointment":
      if (filter.op === "none") return keys === "field,id,op";
      return keys === "days,field,id,op" && isWholeNumber(filter.days);
    case "totalVisits":
      return keys === "count,field,id,op" && isWholeNumber(filter.count);
    case "totalSpend":
      return keys === "amount,field,id,op" && isWholeNumber(filter.amount);
    case "services":
      return keys === "field,id,op,services" && filter.services.length > 0;
    case "birthday":
      return (
        keys === "field,id,months,op" &&
        filter.months.length > 0 &&
        filter.months.every((m) => m >= 1 && m <= 12)
      );
    case "channel":
      return keys === "channels,field,id,op" && filter.channels.length > 0;
  }
}

function make(input: FilterInput, id = "f1"): Filter {
  return { id, ...input } as Filter;
}

describe("newFilterId", () => {
  it("never repeats", () => {
    const ids = new Set(Array.from({ length: 1000 }, newFilterId));
    expect(ids.size).toBe(1000);
  });
});

describe("createFilter", () => {
  it.each<[FilterField, FilterInput]>([
    ["lastVisit", { field: "lastVisit", op: "moreThan", days: 90 }],
    ["firstVisit", { field: "firstVisit", op: "lessThan", days: 30 }],
    ["nextAppointment", { field: "nextAppointment", op: "none" }],
    ["totalVisits", { field: "totalVisits", op: "moreThan", count: 5 }],
    ["totalSpend", { field: "totalSpend", op: "moreThan", amount: 1000 }],
    ["services", { field: "services", op: "includes", services: ["Balayage"] }],
    ["birthday", { field: "birthday", op: "in", months: [10] }],
    ["channel", { field: "channel", op: "includes", channels: ["sms"] }],
  ])("gives %s the + Filter default", (field, expected) => {
    const filter = createFilter(field, { id: "x", today: TODAY });
    expect(filter).toEqual({ id: "x", ...expected });
    expect(isValid(filter)).toBe(true);
  });

  it("generates an id when none is given", () => {
    const a = createFilter("lastVisit");
    const b = createFilter("lastVisit");
    expect(a.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
  });

  it("uses the current month for birthday without a today", () => {
    const filter = createFilter("birthday");
    expect(filter).toMatchObject({ months: [new Date().getMonth() + 1] });
  });

  it("applies an op and value override", () => {
    expect(createFilter("lastVisit", { id: "x", op: "lessThan", value: 14 })).toEqual({
      id: "x",
      field: "lastVisit",
      op: "lessThan",
      days: 14,
    });
    expect(createFilter("services", { id: "x", op: "excludes", value: ["Color", "Gloss"] })).toEqual({
      id: "x",
      field: "services",
      op: "excludes",
      services: ["Color", "Gloss"],
    });
  });

  it("gives next appointment a day value once the op needs one", () => {
    expect(createFilter("nextAppointment", { id: "x", op: "lessThan", value: 7 })).toEqual({
      id: "x",
      field: "nextAppointment",
      op: "lessThan",
      days: 7,
    });
  });

  it("ignores overrides that do not fit, so the filter stays valid", () => {
    const filter = createFilter("totalVisits", { id: "x", op: "includes", value: -3 });
    expect(filter).toEqual({ id: "x", field: "totalVisits", op: "moreThan", count: 5 });
    expect(createFilter("nextAppointment", { id: "x", value: 7 })).toEqual({
      id: "x",
      field: "nextAppointment",
      op: "none",
    });
  });
});

describe("withOperator", () => {
  const cases = FIELDS.flatMap((field) =>
    FIELD_OPERATORS[field].flatMap((from) =>
      FIELD_OPERATORS[field].map((to) => [field, from, to] as const),
    ),
  );

  it.each(cases)("%s: %s to %s stays valid", (field, from, to) => {
    const start = createFilter(field, { id: "x", op: from, today: TODAY });
    expect(start.op).toBe(from);
    const changed = withOperator(start, to);
    expect(changed.op).toBe(to);
    expect(changed.id).toBe("x");
    expect(isValid(changed)).toBe(true);
  });

  it("keeps the value when only the comparison changes", () => {
    const filter = make({ field: "totalSpend", op: "moreThan", amount: 250 });
    expect(withOperator(filter, "lessThan")).toEqual({ ...filter, op: "lessThan" });
  });

  it("ignores an operator that does not fit the field", () => {
    const filter = make({ field: "birthday", op: "in", months: [3] });
    expect(withOperator(filter, "moreThan")).toBe(filter);
  });

  it("drops days for none booked and restores the default after", () => {
    const booked = make({ field: "nextAppointment", op: "moreThan", days: 7 });
    const none = withOperator(booked, "none");
    expect(none).toEqual({ id: "f1", field: "nextAppointment", op: "none" });
    expect(withOperator(none, "lessThan")).toEqual({
      id: "f1",
      field: "nextAppointment",
      op: "lessThan",
      days: DEFAULT_APPOINTMENT_DAYS,
    });
  });

  it("keeps next appointment days between lessThan and moreThan", () => {
    const filter = make({ field: "nextAppointment", op: "lessThan", days: 7 });
    expect(withOperator(filter, "moreThan")).toMatchObject({ op: "moreThan", days: 7 });
  });
});

describe("describeFilter", () => {
  it.each<[FilterInput, string]>([
    [{ field: "lastVisit", op: "moreThan", days: 90 }, "Last visited more than 90 days ago"],
    [{ field: "lastVisit", op: "lessThan", days: 1 }, "Last visited less than 1 day ago"],
    [{ field: "firstVisit", op: "lessThan", days: 30 }, "First visited less than 30 days ago"],
    [{ field: "firstVisit", op: "moreThan", days: 1 }, "First visited more than 1 day ago"],
    [{ field: "nextAppointment", op: "none" }, "Has no appointment booked"],
    [{ field: "nextAppointment", op: "lessThan", days: 14 }, "Has an appointment in less than 14 days"],
    [{ field: "nextAppointment", op: "lessThan", days: 1 }, "Has an appointment in less than 1 day"],
    [
      { field: "nextAppointment", op: "moreThan", days: 30 },
      "Has an appointment more than 30 days from now",
    ],
    [{ field: "totalVisits", op: "moreThan", count: 5 }, "Visited more than 5 times"],
    [{ field: "totalVisits", op: "lessThan", count: 1 }, "Visited fewer than 1 time"],
    [{ field: "totalSpend", op: "moreThan", amount: 1000 }, "Spent more than $1,000"],
    [{ field: "totalSpend", op: "lessThan", amount: 50 }, "Spent less than $50"],
    [{ field: "services", op: "includes", services: ["Balayage"] }, "Booked Balayage"],
    [{ field: "services", op: "includes", services: ["Balayage", "Color"] }, "Booked Balayage or Color"],
    [
      { field: "services", op: "excludes", services: ["Balayage", "Color", "Gloss"] },
      "Never booked Balayage, Color or Gloss",
    ],
    [{ field: "birthday", op: "in", months: [3] }, "Birthday in March"],
    [{ field: "birthday", op: "in", months: [11, 12] }, "Birthday in November or December"],
    [{ field: "birthday", op: "notIn", months: [1, 6, 7] }, "Birthday not in January, June or July"],
    [{ field: "channel", op: "includes", channels: ["sms"] }, "Can get a text"],
    [{ field: "channel", op: "includes", channels: ["email"] }, "Can get an email"],
    [{ field: "channel", op: "includes", channels: ["sms", "email"] }, "Can get a text or an email"],
    [{ field: "channel", op: "excludes", channels: ["sms"] }, "Can’t get a text"],
  ])("%o", (input, expected) => {
    expect(describeFilter(make(input))).toBe(expected);
  });
});

describe("cloneFilters", () => {
  const original: Filter[] = [
    make({ field: "services", op: "includes", services: ["Balayage"] }, "a"),
    make({ field: "lastVisit", op: "moreThan", days: 90 }, "b"),
  ];

  it("copies every filter with a fresh id", () => {
    const copy = cloneFilters(original);
    expect(copy.map((f) => f.id)).not.toContain("a");
    expect(copy.map((f) => f.id)).not.toContain("b");
    expect(new Set(copy.map((f) => f.id)).size).toBe(2);
    expect(filtersEqual(copy, original)).toBe(true);
  });

  it("shares no objects or lists with the original", () => {
    const copy = cloneFilters(original);
    expect(copy[0]).not.toBe(original[0]);
    if (copy[0].field !== "services" || original[0].field !== "services") throw new Error();
    expect(copy[0].services).not.toBe(original[0].services);
    copy[0].services.push("Color");
    expect(original[0].services).toEqual(["Balayage"]);
  });
});

describe("filtersEqual", () => {
  const a: Filter[] = [
    make({ field: "lastVisit", op: "moreThan", days: 90 }, "1"),
    make({ field: "birthday", op: "in", months: [11, 12] }, "2"),
  ];

  it("ignores ids and the order of filters", () => {
    const b: Filter[] = [
      make({ field: "birthday", op: "in", months: [11, 12] }, "x"),
      make({ field: "lastVisit", op: "moreThan", days: 90 }, "y"),
    ];
    expect(filtersEqual(a, b)).toBe(true);
  });

  it("ignores the order of keys and of list values", () => {
    const b = [
      { days: 90, op: "moreThan", field: "lastVisit", id: "z" } as Filter,
      make({ field: "birthday", op: "in", months: [12, 11] }),
    ];
    expect(filtersEqual(a, b)).toBe(true);
  });

  it("detects a changed value or operator", () => {
    expect(filtersEqual(a, [a[0], make({ field: "birthday", op: "in", months: [11] })])).toBe(false);
    expect(filtersEqual(a, [a[0], make({ field: "birthday", op: "notIn", months: [11, 12] })])).toBe(
      false,
    );
    expect(filtersEqual(a, [make({ field: "lastVisit", op: "moreThan", days: 60 }), a[1]])).toBe(false);
  });

  it("detects a missing or repeated filter", () => {
    expect(filtersEqual(a, [a[0]])).toBe(false);
    expect(filtersEqual([a[0], a[0]], [a[0], a[1]])).toBe(false);
    expect(filtersEqual([], [])).toBe(true);
  });
});
