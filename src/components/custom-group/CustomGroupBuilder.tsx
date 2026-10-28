"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { useEffect, useMemo, useReducer, useRef, useState, type RefObject } from "react";
import clientsData from "@/data/clients.json";
import { filterReducer, type FilterAction, type FilterField } from "@/lib/filterReducer";
import { canEmail, canText, filterClients } from "@/lib/matchFilters";
import type { Client } from "@/types";
import { ClientCounts } from "./ClientCounts";
import { ClientsTable } from "./ClientsTable";
import { FilterPanel } from "./FilterPanel";
import { Pagination } from "./Pagination";
import { useToday } from "./useToday";

const PAGE_SIZE = 10;

/** Sorted once, by first name A to Z. Filtering keeps this order. */
const CLIENTS: Client[] = [...clientsData].sort(
  (a, b) =>
    a.first_name.localeCompare(b.first_name) || a.last_name.localeCompare(b.last_name),
);

/** Where focus goes after the next render: a filter id, or the "+ Filter" button. */
const ADD_BUTTON = "add-button";

/**
 * Moves focus to the pending target. The target stays pending until focus
 * lands, because while the "+ Filter" menu is still closing the rest of the
 * page cannot take focus yet.
 */
function focusPending(
  pending: RefObject<string | null>,
  panel: HTMLElement | null,
  addButton: HTMLButtonElement | null,
) {
  const target = pending.current;
  if (!target) return;
  const element =
    target === ADD_BUTTON
      ? addButton
      : panel?.querySelector<HTMLElement>(`[data-filter-id="${target}"] [data-first-control]`);
  element?.focus();
  if (element && document.activeElement === element) pending.current = null;
}

export function CustomGroupBuilder() {
  const today = useToday();
  return (
    <>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Clients</h1>
      {/* The server render has no date, so filters appear once in the browser. */}
      {today && <Builder today={today} />}
    </>
  );
}

function Builder({ today }: { today: Date }) {
  const [filters, dispatch] = useReducer(filterReducer, []);
  const [page, setPage] = useState(1);
  const nextId = useRef(1);
  const focusTarget = useRef<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const matching = useMemo(() => filterClients(CLIENTS, filters, today), [filters, today]);
  const textedCount = useMemo(() => matching.filter(canText).length, [matching]);
  const mailedCount = useMemo(() => matching.filter(canEmail).length, [matching]);
  const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageClients = useMemo(
    () => matching.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [matching, currentPage],
  );

  function applyPendingFocus() {
    focusPending(focusTarget, panelRef.current, addButtonRef.current);
  }

  useEffect(() => {
    focusPending(focusTarget, panelRef.current, addButtonRef.current);
  }, [filters]);

  /** Every filter change goes back to page 1. */
  function update(action: FilterAction) {
    dispatch(action);
    setPage(1);
  }

  function addFilter(field: FilterField) {
    const id = `filter-${nextId.current++}`;
    focusTarget.current = id;
    update({ type: "add", field, id, today });
  }

  function removeFilter(id: string) {
    const index = filters.findIndex((filter) => filter.id === id);
    const neighbour = filters[index + 1] ?? filters[index - 1];
    focusTarget.current = neighbour?.id ?? ADD_BUTTON;
    update({ type: "remove", id });
  }

  function clearAll() {
    focusTarget.current = ADD_BUTTON;
    update({ type: "clearAll" });
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <ClientCounts total={matching.length} texted={textedCount} mailed={mailedCount} />
      <FilterPanel
        filters={filters}
        dispatch={update}
        onAdd={addFilter}
        onRemove={removeFilter}
        onMenuClosed={applyPendingFocus}
        panelRef={panelRef}
        addButtonRef={addButtonRef}
      />
      {/* Room on the right for the Save as button (next step). */}
      <div className="mt-3 flex justify-end gap-3">
        <button
          type="button"
          onClick={clearAll}
          disabled={filters.length === 0}
          className="min-h-11 rounded-lg px-3 text-sm font-bold text-ink hover:bg-ink/5 disabled:cursor-not-allowed disabled:text-ink/60 disabled:hover:bg-transparent"
        >
          Clear all
        </button>
      </div>
      <ClientsTable clients={pageClients} />
      <Pagination
        page={currentPage}
        pageCount={pageCount}
        pageSize={PAGE_SIZE}
        total={matching.length}
        onPageChange={setPage}
      />
    </Tooltip.Provider>
  );
}
