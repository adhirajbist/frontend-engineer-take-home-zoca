import { Scissors, Smile, Zap, type LucideIcon } from "lucide-react";
import { useId, useState } from "react";
import { RainbowIcon } from "./RainbowIcon";

export type QuickAction = "shorter" | "friendlier" | "moreUrgent";

const ACTIONS: { action: QuickAction; label: string; icon: LucideIcon }[] = [
  { action: "shorter", label: "Shorter", icon: Scissors },
  { action: "friendlier", label: "Friendlier", icon: Smile },
  { action: "moreUrgent", label: "More urgent", icon: Zap },
];

const CHIP =
  "flex min-h-11 items-center gap-1 whitespace-nowrap rounded-full border border-plum/40 bg-white px-2 text-xs font-semibold text-ink hover:bg-cream sm:gap-1.5 sm:px-3.5 sm:text-sm short:gap-1 short:px-2.5 short:text-xs";

/**
 * "Quick edits" button that reveals one-tap rewrites of the message. Opened,
 * it shrinks to its icon and the chips sit beside it. Actions are not wired up yet.
 */
export function AiQuickActions({ onAction }: { onAction?: (action: QuickAction) => void }) {
  const [open, setOpen] = useState(false);
  const chipsId = useId();

  return (
    <div className="@container flex flex-wrap gap-1 sm:gap-2 short:gap-1.5">
      {/* One button in both states, so keyboard focus stays put. */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={chipsId}
        onClick={() => setOpen(!open)}
        className={`${CHIP} justify-center ${open ? "min-w-11 bg-track! px-0!" : "px-3! sm:px-4!"}`}
      >
        <RainbowIcon className="size-5 shrink-0" />
        <span className={open ? "sr-only" : undefined}>Quick edits</span>
      </button>
      <div id={chipsId} role="group" aria-label="Quick edits" hidden={!open} className="contents">
        {ACTIONS.map(({ action, label, icon: Icon }) => (
          <button key={action} type="button" onClick={() => onAction?.(action)} className={CHIP}>
            {/* Dropped when the row is too narrow for icons and labels on one line. */}
            <Icon
              aria-hidden="true"
              className="hidden size-3.5 shrink-0 text-plum @[22rem]:block sm:size-4 short:size-3.5 landscape:short:block"
            />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
