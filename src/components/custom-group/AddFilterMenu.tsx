import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Plus } from "lucide-react";
import { useRef, type RefObject } from "react";
import type { FilterField } from "@/lib/filters";
import { FIELD_LABELS, FIELD_ORDER } from "./filterOptions";

type AddFilterMenuProps = {
  onAdd: (field: FilterField) => void;
  /** Called once the menu has fully closed after a pick. */
  onClosed: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
};

export function AddFilterMenu({ onAdd, onClosed, buttonRef }: AddFilterMenuProps) {
  // After picking a field, focus goes to the new row, not back to this button.
  const picked = useRef(false);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        ref={buttonRef}
        aria-label="Add filter"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold hover:bg-ink/5"
      >
        <Plus aria-hidden="true" className="size-4" />
        Filter
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          collisionPadding={16}
          onCloseAutoFocus={(event) => {
            if (!picked.current) return;
            picked.current = false;
            event.preventDefault();
            onClosed();
          }}
          className="focus-burgundy z-10 min-w-56 rounded-xl border border-ink/10 bg-white p-1.5 text-sm text-ink shadow-lg shadow-ink/10"
        >
          {FIELD_ORDER.map((field) => (
            <DropdownMenu.Item
              key={field}
              onSelect={() => {
                picked.current = true;
                onAdd(field);
              }}
              className="flex min-h-11 cursor-pointer items-center rounded-lg px-3 outline-none data-highlighted:bg-burgundy data-highlighted:text-cream"
            >
              {FIELD_LABELS[field]}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
