import { Undo2 } from "lucide-react";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { QuickAction } from "@/ai/constants";
import { ACTIONS, CHIP } from "./AiQuickActions";
import { RainbowIcon } from "./RainbowIcon";

/**
 * Only on wider screens, where icons and labels fit on one line. Not a
 * container query: that would hide the row's width from the short landscape
 * grid, which sizes its side column to fit this row.
 */
const ICON = "hidden size-4 shrink-0 text-plum sm:block short:hidden";

type CardQuickEditsProps = {
  onOpen: () => void;
  onAction: (action: QuickAction) => void;
  onUndo: () => void;
  canUndo: boolean;
  /**
   * While the AI works, every button ignores presses. aria-disabled rather
   * than disabled, so focus stays on the chip that was pressed.
   */
  busy: boolean;
};

/**
 * The Content card's "Quick edits" button. Pressed, it is replaced for good by
 * the quick edit chips and an Undo button; a fresh card starts closed again.
 * Both states are one 44px row, so nothing below moves.
 */
export function CardQuickEdits({ onOpen, onAction, onUndo, canUndo, busy }: CardQuickEditsProps) {
  const [open, setOpen] = useState(false);
  const firstChipRef = useRef<HTMLButtonElement>(null);

  function reveal() {
    // The button goes away, so focus moves to the first chip.
    flushSync(() => setOpen(true));
    firstChipRef.current?.focus();
    onOpen();
  }

  if (!open) {
    return (
      <div className="flex">
        <button type="button" onClick={reveal} className={`${CHIP} justify-center px-3! sm:px-4!`}>
          <RainbowIcon className="size-5 shrink-0" />
          Quick edits
        </button>
      </div>
    );
  }

  const undoDisabled = busy || !canUndo;
  return (
    <div
      role="group"
      aria-label="Quick edits"
      className="flex items-center gap-1 sm:gap-2 short:gap-1.5"
    >
      {ACTIONS.map(({ action, label, icon: Icon }, index) => (
        <button
          key={action}
          ref={index === 0 ? firstChipRef : undefined}
          type="button"
          aria-disabled={busy || undefined}
          onClick={() => !busy && onAction(action)}
          className={CHIP}
        >
          {/* Dropped when the row is too narrow for icons and labels on one line. */}
          <Icon aria-hidden="true" className={ICON} />
          {label}
        </button>
      ))}
      <button
        type="button"
        aria-label="Undo last quick edit"
        aria-disabled={undoDisabled}
        onClick={() => !undoDisabled && onUndo()}
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-plum/40 bg-white text-burgundy hover:bg-cream aria-disabled:cursor-not-allowed aria-disabled:border-ink/20 aria-disabled:text-ink/60 aria-disabled:hover:bg-white"
      >
        <Undo2 aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
