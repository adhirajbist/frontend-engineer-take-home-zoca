import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { SENDER_NAME } from "./dummyContent";

type FullEmailDialogProps = {
  subject: string;
  body: string;
};

/** The whole email, for when the preview had to cut it short. Must sit inside Dialog.Root. */
export function FullEmailDialog({ subject, body }: FullEmailDialogProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-20 flex items-center justify-center bg-ink/50 p-4 motion-safe:data-[state=closed]:animate-overlay-out motion-safe:data-[state=open]:animate-overlay-in">
        <Dialog.Content
          aria-describedby={undefined}
          className="flex max-h-full w-full max-w-lg flex-col rounded-2xl bg-lilac p-3 text-ink shadow-xl shadow-ink/20 motion-safe:data-[state=closed]:animate-dialog-out motion-safe:data-[state=open]:animate-dialog-in sm:p-4"
        >
          <div className="flex shrink-0 justify-end">
            <Dialog.Close
              aria-label="Close"
              className="flex size-11 items-center justify-center rounded-full hover:bg-ink/5"
            >
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </div>
          {/* Scrolls if the email is taller than the screen. */}
          <div className="min-h-0 overflow-y-auto rounded-xl bg-white p-4 shadow-sm shadow-ink/10 sm:p-5">
            <p className="text-xs text-muted">{SENDER_NAME}</p>
            <Dialog.Title className="mt-0.5 wrap-anywhere text-base font-bold sm:text-lg">
              {subject}
            </Dialog.Title>
            <p className="mt-2 whitespace-pre-line wrap-anywhere text-sm leading-snug sm:text-base">
              {body}
            </p>
            <p className="mt-3 text-xs text-muted">Unsubscribe</p>
          </div>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  );
}
