import Image from "next/image";
import type { ReactNode } from "react";
import { BubbleBody } from "@/components/BubbleBody";
import type { AgentNote } from "@/types";

type AgentBubbleProps = {
  /**
   * Pushes the bubble to the bottom of a card (whose body is a flex column)
   * and lines the avatar up with the bubble's bottom, so content above never
   * moves when the bubble's text changes.
   */
  atCardBottom?: boolean;
  /** Extra classes, e.g. to hide the bubble on short screens. */
  className?: string;
  /** Hides the bubble but keeps its space, so the avatar stays put. */
  bubbleHidden?: boolean;
  /**
   * The longest text the bubble can show. Its room is always kept, so content
   * centred above never moves when the text gets shorter (e.g. a reason goes).
   */
  reserveFor?: ReactNode;
  children: ReactNode;
};

/** Steve's avatar with a speech bubble. Shared so every agent message looks the same. */
export function AgentBubble({
  atCardBottom = false,
  className = "",
  bubbleHidden = false,
  reserveFor,
  children,
}: AgentBubbleProps) {
  const placement = atCardBottom ? "mt-auto items-end" : "items-start";
  if (!reserveFor) {
    return (
      <BubbleRow atCardBottom={atCardBottom} bubbleHidden={bubbleHidden} className={`${placement} ${className}`}>
        {children}
      </BubbleRow>
    );
  }
  return (
    // Both rows share one grid cell. The invisible one sets the height.
    <div className={`grid ${atCardBottom ? "mt-auto" : ""} ${className}`}>
      <BubbleRow atCardBottom={atCardBottom} className="invisible col-start-1 row-start-1" ariaHidden>
        {reserveFor}
      </BubbleRow>
      <BubbleRow
        atCardBottom={atCardBottom}
        bubbleHidden={bubbleHidden}
        className={`col-start-1 row-start-1 ${atCardBottom ? "items-end self-end" : "items-start"}`}
      >
        {children}
      </BubbleRow>
    </div>
  );
}

type BubbleRowProps = {
  atCardBottom: boolean;
  bubbleHidden?: boolean;
  ariaHidden?: boolean;
  className: string;
  children: ReactNode;
};

function BubbleRow({ atCardBottom, bubbleHidden = false, ariaHidden, className, children }: BubbleRowProps) {
  const tail = atCardBottom ? "bottom-4 short:bottom-2.5" : "top-4 short:top-2.5";
  return (
    <div aria-hidden={ariaHidden} className={`flex gap-3 short:gap-2 ${className}`}>
      <Image
        src="/steve-profile-icon.png"
        alt={ariaHidden ? "" : "Steve"}
        width={48}
        height={48}
        className="size-12 shrink-0 rounded-full object-cover short:size-8"
      />
      <BubbleBody
        className={`px-4 py-3 text-[clamp(0.875rem,min(4vw,2.6svh),1.125rem)] short:px-3 short:py-2 short:text-xs ${bubbleHidden ? "invisible" : ""}`}
        tailClassName={`-left-1.5 ${tail}`}
      >
        {children}
      </BubbleBody>
    </div>
  );
}

/** A note's reason (if any) above Steve's usual line. */
export function NoteLines({ note }: { note: AgentNote }) {
  return (
    <>
      {note.reason && <p className="mb-2 short:mb-1">{note.reason}</p>}
      <p>{note.neutral}</p>
    </>
  );
}
