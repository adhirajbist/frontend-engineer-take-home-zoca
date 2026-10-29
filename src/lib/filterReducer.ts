import type { Filter } from "@/types";
import {
  cloneFilters,
  createFilter,
  withOperator,
  withValue,
  type FilterField,
  type FilterOp,
  type FilterValue,
} from "./filters";

/** The builder's draft filter list. Rules for each filter live in ./filters. */
export type FilterAction =
  | { type: "add"; field: FilterField; id: string; today: Date }
  | { type: "remove"; id: string }
  | { type: "setOperator"; id: string; op: FilterOp }
  | { type: "setValue"; id: string; value: FilterValue }
  | { type: "clearAll" }
  /** Loads a group's filters as copies with fresh ids. */
  | { type: "replaceAll"; filters: readonly Filter[] };

export function filterReducer(filters: Filter[], action: FilterAction): Filter[] {
  switch (action.type) {
    case "add":
      return [...filters, createFilter(action.field, { id: action.id, today: action.today })];
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
    case "replaceAll":
      return cloneFilters(action.filters);
  }
}
