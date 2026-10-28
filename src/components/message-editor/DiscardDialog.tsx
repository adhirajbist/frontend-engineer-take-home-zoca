import { useRef, type RefObject } from "react";
import { AgentDialog } from "@/components/AgentDialog";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/custom-group/buttonStyles";

type DiscardDialogProps = {
  open: boolean;
  /** Stays on the page. Also runs on Escape and a click outside. */
  onClose: () => void;
  /** Drops the changes and leaves. */
  onDiscard: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
};

/** Asks before leaving with unsaved changes. Close is the safe default. */
export function DiscardDialog({ open, onClose, onDiscard, returnFocusRef }: DiscardDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  return (
    <AgentDialog
      open={open}
      onClose={onClose}
      message="You have not saved the changes. Are you sure you want to go back?"
      initialFocusRef={closeRef}
      returnFocusRef={returnFocusRef}
    >
      <div className="mt-4 flex justify-end gap-3">
        <button ref={closeRef} type="button" onClick={onClose} className={SECONDARY_BUTTON}>
          Close
        </button>
        <button type="button" onClick={onDiscard} className={PRIMARY_BUTTON}>
          Go back
        </button>
      </div>
    </AgentDialog>
  );
}
