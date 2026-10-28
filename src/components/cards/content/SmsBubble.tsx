import { OPT_OUT_LINE } from "@/lib/messageLimits";
import { SENDER_NAME } from "./dummyContent";
import { fitText, useClampToFit } from "./useClampToFit";

/** A text message as it shows on the client's phone. */
export function SmsBubble({ text }: { text: string }) {
  const [textRef] = useClampToFit<HTMLParagraphElement>(text);

  return (
    <div className="flex min-h-0 flex-col items-start">
      <p className="mb-1 ml-3 shrink-0 text-xs text-muted">{SENDER_NAME}</p>
      <div className="relative flex min-h-0 max-w-[min(90%,22rem)] flex-col rounded-2xl rounded-bl-none bg-white px-[clamp(0.625rem,3vw,1rem)] py-[clamp(0.375rem,1.2svh,0.75rem)] shadow-sm shadow-ink/10 short:max-w-full short:px-2.5 short:py-1.5">
        {/* Tail on the bottom-left corner. */}
        <span
          aria-hidden="true"
          className="absolute bottom-0 -left-2 size-3 bg-white [clip-path:polygon(100%_0,100%_100%,0_100%)]"
        />
        <p
          ref={textRef}
          className={`${fitText} whitespace-pre-line wrap-anywhere text-[clamp(0.8125rem,min(3.7vw,2.4svh),1.0625rem)] leading-snug short:text-xs`}
        >
          {text}
        </p>
        <p className="mt-1 shrink-0 text-xs text-muted short:mt-0.5">{OPT_OUT_LINE}</p>
      </div>
    </div>
  );
}
