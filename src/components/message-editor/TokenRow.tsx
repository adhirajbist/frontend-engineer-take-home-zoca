import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { findToken, MESSAGE_TOKENS, type TokenId } from "@/lib/messageTokens";
import { KEEPS_PLACING } from "./usePlacingMode";

type TokenRowProps = {
  /** The token waiting to be placed, if any. */
  placing: TokenId | null;
  onToggle: (id: TokenId) => void;
  /** While the AI works: the chips ignore presses but keep focus. */
  disabled: boolean;
  /** Shown on the right of the chips, e.g. undo and redo. */
  actions: ReactNode;
};

/** Keeps the editor focused (and the phone keyboard open) when the chip is pressed. */
const keepEditorFocus = (event: { preventDefault: () => void }) => event.preventDefault();

/** Token chips with a note on how to place them. */
export function TokenRow({ placing, onToggle, disabled, actions }: TokenRowProps) {
  const label = placing ? findToken(placing)?.label : null;

  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-1">
      <div className="col-start-1 row-start-1 flex flex-wrap gap-2">
        {MESSAGE_TOKENS.map((token) => {
          const pressed = placing === token.id;
          return (
            <button
              key={token.id}
              type="button"
              aria-pressed={pressed}
              aria-disabled={disabled || undefined}
              {...KEEPS_PLACING}
              onPointerDown={keepEditorFocus}
              onClick={() => !disabled && onToggle(token.id)}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold aria-disabled:cursor-not-allowed aria-disabled:opacity-60 ${
                pressed
                  ? "border-purple bg-purple text-white"
                  : "border-purple/40 bg-purple/12 text-burgundy hover:bg-purple/20"
              }`}
            >
              <Plus aria-hidden="true" className="size-4" />
              {token.label}
            </button>
          );
        })}
      </div>
      {/* Two lines tall on narrow screens either way, so the fields don't move
          when placing starts. */}
      <p className="col-span-2 row-start-2 min-h-10 text-sm text-muted sm:min-h-5">
        {label
          ? `Now tap in your message where ${label} should go.`
          : "Tap a token, then tap your message where you want to place it."}
      </p>
      <div className="col-start-2 row-start-1">{actions}</div>
    </div>
  );
}
