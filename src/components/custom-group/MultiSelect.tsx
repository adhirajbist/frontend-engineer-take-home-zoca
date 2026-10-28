import * as Popover from "@radix-ui/react-popover";
import { ChevronDown } from "lucide-react";

type Option<T> = { value: T; label: string };

type MultiSelectProps<T extends string | number> = {
  label: string;
  /** Plural word for the summary, e.g. "services" in "3 services". */
  noun: string;
  options: Option<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
};

function summarize<T>(options: Option<T>[], selected: T[], noun: string): string {
  const labels = options.filter((o) => selected.includes(o.value)).map((o) => o.label);
  return labels.length <= 2 ? labels.join(", ") : `${labels.length} ${noun}`;
}

/** Checkbox list in a popover. At least one option always stays selected. */
export function MultiSelect<T extends string | number>({
  label,
  noun,
  options,
  selected,
  onChange,
}: MultiSelectProps<T>) {
  const summary = summarize(options, selected, noun);

  function toggle(value: T, checked: boolean) {
    const next = checked ? [...selected, value] : selected.filter((v) => v !== value);
    // Keep the menu's order so summaries read naturally.
    onChange(options.map((o) => o.value).filter((v) => next.includes(v)));
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`${label}: ${summary}`}
        className="inline-flex h-11 max-w-full min-w-0 items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3 text-sm"
      >
        <span className="truncate">{summary}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-ink/70" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={16}
          className="focus-burgundy z-10 max-h-(--radix-popover-content-available-height) w-60 overflow-y-auto rounded-xl border border-ink/10 bg-white p-1.5 text-sm text-ink shadow-lg shadow-ink/10"
        >
          <fieldset>
            <legend className="sr-only">{label}</legend>
            {options.map((option) => {
              const checked = selected.includes(option.value);
              const isLast = checked && selected.length === 1;
              return (
                <label
                  key={option.value}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 hover:bg-ink/5 has-disabled:cursor-default"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isLast}
                    onChange={(event) => toggle(option.value, event.target.checked)}
                    className="size-4 accent-burgundy"
                  />
                  {option.label}
                </label>
              );
            })}
          </fieldset>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
