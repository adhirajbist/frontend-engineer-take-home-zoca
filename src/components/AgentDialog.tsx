import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { AgentBubble } from "@/components/AgentBubble";

type AgentDialogProps = {
  open: boolean;
  /** Also runs on Escape and on a click outside the dialog. */
  onClose: () => void;
  /** What Steve says. It names the dialog. */
  message: ReactNode;
  /** Where focus goes when the dialog opens. */
  initialFocusRef: RefObject<HTMLElement | null>;
  /** Where focus goes when the dialog closes. */
  returnFocusRef: RefObject<HTMLElement | null>;
  /**
   * Steve is busy, e.g. while an animation plays: his bubble hides (the avatar
   * stays put), Escape and clicks outside do nothing, focus moves to the
   * dialog itself, and children may draw outside the dialog.
   */
  busy?: boolean;
  children: ReactNode;
};

/** A small dialog where Steve asks something, with the answer below his bubble. */
export function AgentDialog({
  open,
  onClose,
  message,
  initialFocusRef,
  returnFocusRef,
  busy = false,
  children,
}: AgentDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // The focused button may hide while busy; keep focus inside the dialog.
  useEffect(() => {
    if (busy) contentRef.current?.focus();
  }, [busy]);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        {/* Phones and short screens: near the top, so the on-screen keyboard
            never covers it. Roomy screens: centred. */}
        <Dialog.Overlay className="fixed inset-0 z-20 flex items-start justify-center bg-ink/50 px-4 pt-[max(1rem,6svh)] motion-safe:data-[state=closed]:animate-overlay-out motion-safe:data-[state=open]:animate-overlay-in [@media(min-width:40rem)_and_(min-height:30rem)]:items-center [@media(min-width:40rem)_and_(min-height:30rem)]:pt-0">
          <Dialog.Content
            ref={contentRef}
            aria-describedby={undefined}
            onEscapeKeyDown={(event) => busy && event.preventDefault()}
            onInteractOutside={(event) => busy && event.preventDefault()}
            // Focus only lands here while busy. The dialog isn't a control, so
            // no ring (inline, as the global :focus-visible rule beats utilities).
            style={{ outline: "none" }}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              initialFocusRef.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              returnFocusRef.current?.focus();
            }}
            className={`focus-burgundy relative max-h-[calc(100svh-2rem)] w-full max-w-md rounded-2xl bg-cream p-4 text-ink shadow-xl shadow-ink/20 motion-safe:data-[state=closed]:animate-dialog-out motion-safe:data-[state=open]:animate-dialog-in sm:p-5 ${busy ? "overflow-visible" : "overflow-y-auto"}`}
          >
            <AgentBubble bubbleHidden={busy}>
              <Dialog.Title asChild>
                <p>{message}</p>
              </Dialog.Title>
            </AgentBubble>
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
