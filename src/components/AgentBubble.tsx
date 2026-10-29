import Image from "next/image";
import type { ReactNode } from "react";
import { BubbleBody } from "@/components/BubbleBody";

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
  children: ReactNode;
};

/** Steve's avatar with a speech bubble. Shared so every agent message looks the same. */
export function AgentBubble({
  atCardBottom = false,
  className = "",
  bubbleHidden = false,
  children,
}: AgentBubbleProps) {
  const placement = atCardBottom ? "mt-auto items-end" : "items-start";
  const tail = atCardBottom ? "bottom-4 short:bottom-2.5" : "top-4 short:top-2.5";
  return (
    <div className={`flex gap-3 short:gap-2 ${placement} ${className}`}>
      <Image
        src="/steve-profile-icon.png"
        alt="Steve"
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
