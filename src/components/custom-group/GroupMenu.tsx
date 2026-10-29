import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { segmentSections } from "@/lib/segments";
import type { Segment } from "@/types";

type GroupMenuProps = {
  selected: Segment;
  savedSegments: readonly Segment[];
  onSelect: (segment: Segment) => void;
};

/** Picks the group whose filters load into the panel. Same look as "+ Filter". */
export function GroupMenu({ selected, savedSegments, onSelect }: GroupMenuProps) {
  const { saved, birthdays, others } = segmentSections(savedSegments);

  function select(id: string) {
    const segment = [...saved, ...birthdays, ...others].find((s) => s.id === id);
    if (segment) onSelect(segment);
  }

  return (
    <DropdownMenu.Root>
      <span id="group-menu-label" className="sr-only">
        Choose a group
      </span>
      {/* Named "Choose a group"; the chosen group is read as its description. */}
      <DropdownMenu.Trigger
        aria-labelledby="group-menu-label"
        aria-describedby="group-menu-value"
        className="inline-flex min-h-11 min-w-0 items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3 text-sm font-semibold hover:bg-ink/5"
      >
        <span id="group-menu-value" className="truncate">
          {selected.name}
        </span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          collisionPadding={16}
          className="focus-burgundy z-10 max-h-(--radix-dropdown-menu-content-available-height) min-w-56 overflow-y-auto rounded-xl border border-ink/10 bg-white p-1.5 text-sm text-ink shadow-lg shadow-ink/10"
        >
          <DropdownMenu.RadioGroup value={selected.id} onValueChange={select}>
            {saved.length > 0 && <Section id="your-groups" heading="Your groups" segments={saved} />}
            <Section id="birthdays" heading="Birthdays" segments={birthdays} />
            <Section id="other-groups" segments={others} />
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

type SectionProps = {
  id: string;
  heading?: string;
  segments: readonly Segment[];
};

function Section({ id, heading, segments }: SectionProps) {
  const headingId = `group-menu-${id}`;
  return (
    <DropdownMenu.Group aria-labelledby={heading ? headingId : undefined}>
      {heading && (
        <DropdownMenu.Label
          id={headingId}
          className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-ink/70"
        >
          {heading}
        </DropdownMenu.Label>
      )}
      {segments.map((segment) => (
        <DropdownMenu.RadioItem
          key={segment.id}
          value={segment.id}
          className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 outline-none data-highlighted:bg-burgundy data-highlighted:text-cream data-[state=checked]:font-bold"
        >
          {segment.name}
          <DropdownMenu.ItemIndicator>
            <Check aria-hidden="true" className="size-4" />
          </DropdownMenu.ItemIndicator>
        </DropdownMenu.RadioItem>
      ))}
    </DropdownMenu.Group>
  );
}
