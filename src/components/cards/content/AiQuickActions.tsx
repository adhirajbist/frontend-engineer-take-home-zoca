import { Scissors, Smile, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { useId, useState, type RefObject } from "react";
import type { QuickAction } from "@/ai/constants";
import { RainbowIcon } from "./RainbowIcon";

export type { QuickAction };

const ACTIONS: { action: QuickAction; label: string; icon: LucideIcon }[] = [
  { action: "shorter", label: "Shorter", icon: Scissors },
  { action: "friendlier", label: "Friendlier", icon: Smile },
  { action: "moreUrgent", label: "More urgent", icon: Zap },
];

const CHIP =
  "flex min-h-11 aria-disabled:cursor-not-allowed aria-disabled:text-ink/60 aria-disabled:hover:bg-white items-center gap-1 whitespace-nowrap rounded-full border border-plum/40 bg-white px-2 text-xs font-semibold text-ink hover:bg-cream sm:gap-1.5 sm:px-3.5 sm:text-sm short:gap-1 short:px-2.5 short:text-xs";

/**
 * "Quick edits" button that reveals one-tap rewrites of the message. Opened,
 * it shrinks to its icon and the chips sit beside it.
 */
type AiQuickActionsProps = {
  onAction?: (action: QuickAction) => void;
  /** When given, a "Custom prompt" chip follows the quick edits. */
  onCustomPrompt?: () => void;
  customPromptRef?: RefObject<HTMLButtonElement | null>;
  /** Lets the parent move focus back to a quick edit chip. */
  actionRefs?: RefObject<Partial<Record<QuickAction, HTMLButtonElement | null>>>;
  /**
   * While the AI works, every button ignores presses. aria-disabled rather
   * than disabled, so focus stays on the chip that was pressed.
   */
  busy?: boolean;
};

const ICON =
  "hidden size-3.5 shrink-0 text-plum @[22rem]:block sm:size-4 short:size-3.5 landscape:short:block";

export function AiQuickActions({
  onAction,
  onCustomPrompt,
  customPromptRef,
  actionRefs,
  busy = false,
}: AiQuickActionsProps) {
  const [open, setOpen] = useState(false);
  const chipsId = useId();

  return (
    <div className="@container flex flex-wrap gap-1 sm:gap-2 short:gap-1.5">
      {/* One button in both states, so keyboard focus stays put. */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={chipsId}
        aria-disabled={busy || undefined}
        onClick={() => !busy && setOpen(!open)}
        className={`${CHIP} justify-center ${open ? "min-w-11 bg-track! px-0!" : "px-3! sm:px-4!"}`}
      >
        <RainbowIcon className="size-5 shrink-0" />
        <span className={open ? "sr-only" : undefined}>Quick edits</span>
      </button>
      <div id={chipsId} role="group" aria-label="Quick edits" hidden={!open} className="contents">
        {ACTIONS.map(({ action, label, icon: Icon }) => (
          <button
            key={action}
            ref={(button) => {
              if (actionRefs) actionRefs.current[action] = button;
            }}
            type="button"
            aria-disabled={busy || undefined}
            onClick={() => !busy && onAction?.(action)}
            className={CHIP}
          >
            {/* Dropped when the row is too narrow for icons and labels on one line. */}
            <Icon aria-hidden="true" className={ICON} />
            {label}
          </button>
        ))}
        {onCustomPrompt && (
          <button
            ref={customPromptRef}
            type="button"
            aria-disabled={busy || undefined}
            onClick={() => !busy && onCustomPrompt()}
            className={CHIP}
          >
            <Sparkles aria-hidden="true" className={ICON} />
            Custom prompt
          </button>
        )}
      </div>
    </div>
  );
}
