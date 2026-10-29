import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { OPT_OUT_LINE } from "@/lib/messageLimits";
import { SENDER_NAME } from "./dummyContent";

/** Already rendered for the sample client, e.g. with renderMessage. */
export type MessagePreview =
  | { channel: "sms"; text: string }
  | { channel: "email"; subject: string; body: string };

/** The whole message as the client sees it, never cut short. Must sit inside Dialog.Root. */
export function MessagePreviewDialog({ preview }: { preview: MessagePreview }) {
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
          {preview.channel === "email" ? (
            <FullEmail subject={preview.subject} body={preview.body} />
          ) : (
            <FullText text={preview.text} />
          )}
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  );
}

function FullEmail({ subject, body }: { subject: string; body: string }) {
  return (
    // Scrolls if the email is taller than the screen.
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
  );
}

/** Looks like SmsBubble, without cutting the text to fit. */
function FullText({ text }: { text: string }) {
  return (
    <div className="flex min-h-0 flex-col items-start overflow-y-auto px-2 pb-2">
      <Dialog.Title className="sr-only">Text message</Dialog.Title>
      <p className="mb-1 ml-3 text-xs text-muted">{SENDER_NAME}</p>
      <div className="relative max-w-[min(90%,22rem)] rounded-2xl rounded-bl-none bg-white px-4 py-3 shadow-sm shadow-ink/10">
        {/* Tail on the bottom-left corner. */}
        <span
          aria-hidden="true"
          className="absolute bottom-0 -left-2 size-3 bg-white [clip-path:polygon(100%_0,100%_100%,0_100%)]"
        />
        <p className="whitespace-pre-line wrap-anywhere text-sm leading-snug sm:text-base">{text}</p>
        <p className="mt-1 text-xs text-muted">{OPT_OUT_LINE}</p>
      </div>
    </div>
  );
}
