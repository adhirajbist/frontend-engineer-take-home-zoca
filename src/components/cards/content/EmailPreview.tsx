import * as Dialog from "@radix-ui/react-dialog";
import { SENDER_NAME } from "./dummyContent";
import { MessagePreviewDialog } from "./MessagePreviewDialog";
import { fitText, useClampToFit } from "./useClampToFit";

type EmailPreviewProps = {
  subject: string;
  body: string;
};

/**
 * An email as the client sees it when they open it. If the body is cut off
 * to fit, tapping the card opens the full email.
 */
export function EmailPreview({ subject, body }: EmailPreviewProps) {
  const [bodyRef, clamped] = useClampToFit<HTMLParagraphElement>(body);

  return (
    <Dialog.Root>
      <div className="relative flex min-h-0 min-w-0 flex-col rounded-xl bg-white px-[clamp(0.625rem,3vw,1.25rem)] py-[clamp(0.375rem,1.2svh,1rem)] shadow-sm shadow-ink/10 short:px-2.5 short:py-1.5">
        <p className="shrink-0 text-xs text-muted">{SENDER_NAME}</p>
        {/* One line, cut off with "..." like in an inbox. */}
        <p className="mt-0.5 shrink-0 truncate text-[clamp(0.8125rem,min(3.7vw,2.4svh),1.0625rem)] font-bold short:text-xs">
          {subject}
        </p>
        <p
          ref={bodyRef}
          className={`${fitText} mt-1 whitespace-pre-line wrap-anywhere text-[clamp(0.8125rem,min(3.5vw,2.2svh),1rem)] leading-snug short:mt-0.5 short:text-xs`}
        >
          {body}
        </p>
        <p className="mt-1.5 flex shrink-0 justify-between gap-2 text-xs short:mt-0.5">
          <span className="text-muted">Unsubscribe</span>
          {clamped && (
            <span aria-hidden="true" className="font-bold text-plum underline">
              Read more
            </span>
          )}
        </p>
        {/* Covers the whole card, so the tap target is big. */}
        {clamped && (
          <Dialog.Trigger
            aria-label="Show full email"
            className="absolute inset-0 rounded-xl hover:bg-ink/3"
          />
        )}
      </div>
      <MessagePreviewDialog preview={{ channel: "email", subject, body }} />
    </Dialog.Root>
  );
}
