import { ChevronDown, Trash2 } from "lucide-react";
import type { Dispatch } from "react";
import type { FilterAction } from "@/lib/filterReducer";
import { FIELD_OPERATORS, type FilterValue } from "@/lib/filters";
import type { Filter } from "@/types";
import {
  CHANNEL_OPTIONS,
  FIELD_LABELS,
  MONTH_OPTIONS,
  OPERATOR_LABELS,
  SERVICE_OPTIONS,
} from "./filterOptions";
import { MultiSelect } from "./MultiSelect";
import { NumberInput } from "./NumberInput";

type FilterRowProps = {
  filter: Filter;
  position: number;
  dispatch: Dispatch<FilterAction>;
  onRemove: () => void;
};

/** Grey box for the field name and for units like "days ago". */
const CHIP = "inline-flex h-11 items-center rounded-lg bg-ink/5 px-3 text-sm font-medium";

/** Controls inside this never wrap apart, so a unit or the bin never dangles alone. */
const KEEP_TOGETHER = "inline-flex max-w-full min-w-0 items-center gap-2";

/**
 * One filter as a sentence: [field] [operator] [value] [unit] [delete].
 * The operator select is marked data-first-control so the page can focus it.
 */
export function FilterRow({ filter, position, dispatch, onRemove }: FilterRowProps) {
  const label = FIELD_LABELS[filter.field];
  const operators = FIELD_OPERATORS[filter.field];
  const hasValue = !(filter.field === "nextAppointment" && filter.op === "none");

  function setOperator(value: string) {
    const op = operators.find((o) => o === value);
    if (op) dispatch({ type: "setOperator", id: filter.id, op });
  }

  function setValue(value: FilterValue) {
    dispatch({ type: "setValue", id: filter.id, value });
  }

  const operatorSelect = (
    <span className="relative inline-flex shrink-0">
      <select
        data-first-control
        aria-label={`${label} condition`}
        value={filter.op}
        onChange={(event) => setOperator(event.target.value)}
        className="h-11 appearance-none rounded-lg border border-ink/20 bg-white pr-8.5 pl-3 text-sm"
      >
        {operators.map((op) => (
          <option key={op} value={op}>
            {OPERATOR_LABELS[op]}
          </option>
        ))}
      </select>
      {/* Same chevron as the multi-select, in place of the browser's own arrow. */}
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink/70"
      />
    </span>
  );

  const removeButton = (
    <button
      type="button"
      aria-label={`Remove filter ${position}: ${label}`}
      onClick={onRemove}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-ink/70 hover:bg-ink/5 hover:text-ink"
    >
      <Trash2 aria-hidden="true" className="size-5" />
    </button>
  );

  return (
    <div
      role="group"
      aria-label={`Filter ${position}: ${label}`}
      data-filter-id={filter.id}
      className="flex flex-wrap items-center gap-2"
    >
      <span className={CHIP}>{label}</span>
      {hasValue ? (
        <>
          {operatorSelect}
          <span className={KEEP_TOGETHER}>
            <FilterValueInput filter={filter} label={label} onChange={setValue} />
            {removeButton}
          </span>
        </>
      ) : (
        <span className={KEEP_TOGETHER}>
          {operatorSelect}
          {removeButton}
        </span>
      )}
    </div>
  );
}

type FilterValueInputProps = {
  filter: Filter;
  label: string;
  onChange: (value: FilterValue) => void;
};

function Unit({ children }: { children: string }) {
  return <span className={`${CHIP} shrink-0`}>{children}</span>;
}

function FilterValueInput({ filter, label, onChange }: FilterValueInputProps) {
  switch (filter.field) {
    case "lastVisit":
    case "firstVisit":
      return (
        <>
          <NumberInput value={filter.days} onChange={onChange} label={`${label}: number of days ago`} />
          <Unit>days ago</Unit>
        </>
      );
    case "nextAppointment":
      if (filter.op === "none") return null;
      return (
        <>
          <NumberInput value={filter.days} onChange={onChange} label={`${label}: number of days from now`} />
          <Unit>days from now</Unit>
        </>
      );
    case "totalVisits":
      return (
        <>
          <NumberInput value={filter.count} onChange={onChange} label={`${label}: number of visits`} />
          <Unit>visits</Unit>
        </>
      );
    case "totalSpend":
      return (
        <>
          <span aria-hidden="true" className={`${CHIP} shrink-0`}>
            $
          </span>
          <NumberInput
            value={filter.amount}
            onChange={onChange}
            label={`${label} in dollars`}
            className="w-24"
          />
        </>
      );
    case "services":
      return (
        <MultiSelect
          label={label}
          noun="services"
          options={SERVICE_OPTIONS}
          selected={filter.services}
          onChange={onChange}
        />
      );
    case "birthday":
      return (
        <MultiSelect
          label={`${label} month`}
          noun="months"
          options={MONTH_OPTIONS}
          selected={filter.months}
          onChange={onChange}
        />
      );
    case "channel":
      return (
        <MultiSelect
          label={label}
          noun="channels"
          options={CHANNEL_OPTIONS}
          selected={filter.channels}
          onChange={onChange}
        />
      );
  }
}
