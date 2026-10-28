import { describe, expect, it } from "vitest";
import type { Filter } from "@/types";
import {
  DEFAULT_APPOINTMENT_DAYS,
  createFilter,
  filterReducer,
  type FilterField,
} from "./filterReducer";

/** Filter without its id, kept per field. */
type FilterInput = Filter extends infer F ? (F extends Filter ? Omit<F, "id"> : never) : never;

const TODAY = new Date(2026, 9, 28); // October

function add(filters: Filter[], field: FilterField, id = "f1"): Filter[] {
  return filterReducer(filters, { type: "add", field, id, today: TODAY });
}

describe("createFilter defaults", () => {
  it.each<[FilterField, FilterInput]>([
    ["lastVisit", { field: "lastVisit", op: "moreThan", days: 90 }],
    ["firstVisit", { field: "firstVisit", op: "lessThan", days: 30 }],
    ["nextAppointment", { field: "nextAppointment", op: "none" }],
    ["totalVisits", { field: "totalVisits", op: "moreThan", count: 5 }],
    ["totalSpend", { field: "totalSpend", op: "moreThan", amount: 1000 }],
    ["services", { field: "services", op: "includes", services: ["Balayage"] }],
    ["birthday", { field: "birthday", op: "in", months: [10] }],
    ["channel", { field: "channel", op: "includes", channels: ["sms"] }],
  ])("%s", (field, expected) => {
    expect(createFilter(field, "x", TODAY)).toEqual({ id: "x", ...expected });
  });
});

describe("filterReducer", () => {
  it("adds filters in order, including the same field twice", () => {
    const filters = add(add([], "lastVisit", "a"), "lastVisit", "b");
    expect(filters.map((f) => f.id)).toEqual(["a", "b"]);
  });

  it("removes one filter by id", () => {
    const filters = add(add([], "lastVisit", "a"), "totalVisits", "b");
    expect(filterReducer(filters, { type: "remove", id: "a" }).map((f) => f.id)).toEqual(["b"]);
  });

  it("clears all filters", () => {
    expect(filterReducer(add([], "birthday"), { type: "clearAll" })).toEqual([]);
  });

  it("changes an operator and keeps the value", () => {
    const [filter] = filterReducer(add([], "lastVisit"), {
      type: "setOperator",
      id: "f1",
      op: "lessThan",
    });
    expect(filter).toEqual({ id: "f1", field: "lastVisit", op: "lessThan", days: 90 });
  });

  it("ignores an operator that does not fit the field", () => {
    const filters = add([], "lastVisit");
    expect(filterReducer(filters, { type: "setOperator", id: "f1", op: "includes" })).toEqual(filters);
  });

  it("drops days when next appointment switches to none booked", () => {
    let filters = add([], "nextAppointment");
    filters = filterReducer(filters, { type: "setOperator", id: "f1", op: "lessThan" });
    expect(filters[0]).toEqual({
      id: "f1",
      field: "nextAppointment",
      op: "lessThan",
      days: DEFAULT_APPOINTMENT_DAYS,
    });
    filters = filterReducer(filters, { type: "setValue", id: "f1", value: 7 });
    filters = filterReducer(filters, { type: "setOperator", id: "f1", op: "moreThan" });
    expect(filters[0]).toEqual({ id: "f1", field: "nextAppointment", op: "moreThan", days: 7 });
    filters = filterReducer(filters, { type: "setOperator", id: "f1", op: "none" });
    expect(filters[0]).toEqual({ id: "f1", field: "nextAppointment", op: "none" });
  });

  it("sets whole number values", () => {
    const [filter] = filterReducer(add([], "totalSpend"), { type: "setValue", id: "f1", value: 250 });
    expect(filter).toMatchObject({ amount: 250 });
  });

  it.each([-1, 1.5, Number.NaN, ["Balayage"]])("rejects %s as a number value", (value) => {
    const filters = add([], "totalVisits");
    expect(filterReducer(filters, { type: "setValue", id: "f1", value })).toEqual(filters);
  });

  it("accepts zero", () => {
    const [filter] = filterReducer(add([], "lastVisit"), { type: "setValue", id: "f1", value: 0 });
    expect(filter).toMatchObject({ days: 0 });
  });

  it("ignores a value for next appointment while none booked", () => {
    const filters = add([], "nextAppointment");
    expect(filterReducer(filters, { type: "setValue", id: "f1", value: 5 })).toEqual(filters);
  });

  it("sets list values and refuses an empty list", () => {
    let filters = add([], "services");
    filters = filterReducer(filters, { type: "setValue", id: "f1", value: ["Color", "Gloss"] });
    expect(filters[0]).toMatchObject({ services: ["Color", "Gloss"] });
    expect(filterReducer(filters, { type: "setValue", id: "f1", value: [] })).toEqual(filters);
  });

  it("refuses months outside 1 to 12 and unknown channels", () => {
    const birthday = add([], "birthday");
    expect(filterReducer(birthday, { type: "setValue", id: "f1", value: [13] })).toEqual(birthday);
    const channel = add([], "channel");
    expect(filterReducer(channel, { type: "setValue", id: "f1", value: ["fax"] })).toEqual(channel);
    expect(
      filterReducer(channel, { type: "setValue", id: "f1", value: ["sms", "email"] })[0],
    ).toMatchObject({ channels: ["sms", "email"] });
  });
});
