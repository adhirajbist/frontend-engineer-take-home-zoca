import { useEffect, useState } from "react";
import { findToken, type TokenId } from "@/lib/messageTokens";

/**
 * Marks what a tap may land on without cancelling placing mode: the message
 * fields (a tap there adds the token) and the token chips (they toggle it).
 */
export const KEEPS_PLACING = { "data-keeps-placing": "" } as const;

/**
 * Tap-to-place: tapping a token chip turns this on, and the next tap in a
 * field adds the token there. Escape or a tap anywhere else cancels it.
 */
export function usePlacingMode(announce: (text: string) => void) {
  const [placing, setPlacing] = useState<TokenId | null>(null);

  /** Also for dialogs that open over the editor. */
  function cancelPlacing() {
    if (!placing) return;
    setPlacing(null);
    announce("Cancelled");
  }

  function togglePlacing(id: TokenId) {
    if (placing === id) {
      cancelPlacing();
      return;
    }
    setPlacing(id);
    announce(`Tap where you want ${findToken(id)?.label ?? "the token"}`);
  }

  /** After a token was added, by a tap or at the cursor. */
  function placed(id: TokenId) {
    setPlacing(null);
    announce(`${findToken(id)?.label ?? "Token"} added`);
  }

  useEffect(() => {
    if (!placing) return;
    function cancel() {
      setPlacing(null);
      announce("Cancelled");
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") cancel();
    }
    // A click, not a pointerdown, so a scroll that starts outside the fields
    // doesn't cancel.
    function onClick(event: MouseEvent) {
      if (!(event.target as Element).closest("[data-keeps-placing]")) cancel();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick, true);
    };
  }, [placing, announce]);

  return { placing, togglePlacing, cancelPlacing, placed };
}
