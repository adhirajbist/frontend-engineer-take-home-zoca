import * as Tabs from "@radix-ui/react-tabs";

type SegmentedTabsProps = {
  label: string;
  options: readonly { value: string; label: string }[];
  /** Placement, e.g. "ml-auto". */
  className?: string;
  /** Every tab ignores presses, e.g. while the AI works. */
  disabled?: boolean;
};

/** Pill-shaped switch of Radix tabs. Must sit inside Tabs.Root. */
export function SegmentedTabs({ label, options, className = "", disabled = false }: SegmentedTabsProps) {
  return (
    <Tabs.List
      aria-label={label}
      className={`grid shrink-0 auto-cols-fr grid-flow-col rounded-full bg-track p-0.5 sm:p-1 ${className}`}
    >
      {options.map((option) => (
        <Tabs.Trigger
          key={option.value}
          value={option.value}
          disabled={disabled}
          className="min-h-11 min-w-16 rounded-full px-3 text-sm text-muted sm:min-w-20 sm:px-4 sm:text-base disabled:cursor-not-allowed data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-ink data-[state=active]:shadow-sm data-[state=active]:shadow-ink/15"
        >
          {option.label}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
  );
}
