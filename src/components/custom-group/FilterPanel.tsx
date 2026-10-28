import type { Dispatch, RefObject } from "react";
import type { FilterAction } from "@/lib/filterReducer";
import type { FilterField } from "@/lib/filters";
import type { Filter } from "@/types";
import { AddFilterMenu } from "./AddFilterMenu";
import { FilterRow } from "./FilterRow";

type FilterPanelProps = {
  filters: Filter[];
  dispatch: Dispatch<FilterAction>;
  onAdd: (field: FilterField) => void;
  onRemove: (id: string) => void;
  onMenuClosed: () => void;
  panelRef: RefObject<HTMLElement | null>;
  addButtonRef: RefObject<HTMLButtonElement | null>;
};

export function FilterPanel({
  filters,
  dispatch,
  onAdd,
  onRemove,
  onMenuClosed,
  panelRef,
  addButtonRef,
}: FilterPanelProps) {
  return (
    <section
      ref={panelRef}
      aria-labelledby="filter-panel-title"
      className="mt-5 rounded-xl border border-ink/10 bg-white p-3 sm:p-4"
    >
      <h2
        id="filter-panel-title"
        className="text-xs font-semibold uppercase tracking-wider text-ink/70"
      >
        All clients
      </h2>
      {filters.length > 0 && (
        <div className="mt-3 space-y-3 sm:pl-4">
          {filters.map((filter, index) => (
            <FilterRow
              key={filter.id}
              filter={filter}
              position={index + 1}
              dispatch={dispatch}
              onRemove={() => onRemove(filter.id)}
            />
          ))}
        </div>
      )}
      {/* Same indent as the rows, so the button's box (seen on hover) lines up
          with the field name boxes, and its px-3 lines the "+" up with their text. */}
      <div className="mt-3 sm:pl-4">
        <AddFilterMenu onAdd={onAdd} onClosed={onMenuClosed} buttonRef={addButtonRef} />
      </div>
    </section>
  );
}
