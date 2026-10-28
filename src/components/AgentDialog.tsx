import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode, RefObject } from "react";
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
  children: ReactNode;
};

/** A small dialog where Steve asks something, with the answer below his bubble. */
export function AgentDialog({
  open,
  onClose,
  message,
  initialFocusRef,
  returnFocusRef,
  children,
}: AgentDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        {/* Phones and short screens: near the top, so the on-screen keyboard
            never covers it. Roomy screens: centred. */}
        <Dialog.Overlay className="fixed inset-0 z-20 flex items-start justify-center bg-ink/50 px-4 pt-[max(1rem,6svh)] motion-safe:data-[state=closed]:animate-overlay-out motion-safe:data-[state=open]:animate-overlay-in [@media(min-width:40rem)_and_(min-height:30rem)]:items-center [@media(min-width:40rem)_and_(min-height:30rem)]:pt-0">
          <Dialog.Content
            aria-describedby={undefined}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              initialFocusRef.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              returnFocusRef.current?.focus();
            }}
            className="focus-burgundy max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-cream p-4 text-ink shadow-xl shadow-ink/20 motion-safe:data-[state=closed]:animate-dialog-out motion-safe:data-[state=open]:animate-dialog-in sm:p-5"
          >
            <AgentBubble>
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
