import Image from "next/image";
import Link from "next/link";
import type { RefObject } from "react";
import { BubbleBody } from "@/components/BubbleBody";
import { CAMPAIGN_PATH } from "@/lib/editorRoutes";
import { IDLE_MESSAGE, READY_MESSAGE, type SteveFlow } from "@/lib/steveFlow";
import { TypingDots } from "./TypingDots";

/** Real pixel size of steve-transparent-bg.png. */
const STEVE_WIDTH = 455;
const STEVE_HEIGHT = 548;

type SteveIntroProps = {
  flow: SteveFlow;
  ctaRef: RefObject<HTMLAnchorElement | null>;
};

/**
 * Steve with his bubble beside him, lined up with the input's left edge.
 * Steve is 250px tall on wide screens and shrinks on phones (130px at 360px)
 * so the bubble and its one-line button still fit beside him. The bubble hugs its text.
 *
 * min-h fits Steve's longest reply (148px at 360px), so the input below never
 * moves when his text changes. On wider screens Steve is taller than that anyway.
 */
export function SteveIntro({ flow, ctaRef }: SteveIntroProps) {
  return (
    <div className="flex min-h-38 items-center gap-3 sm:gap-4">
      <Image
        src="/steve-transparent-bg.png"
        alt="Steve"
        width={STEVE_WIDTH}
        height={STEVE_HEIGHT}
        preload
        className="h-[clamp(7.5rem,36vw,15.625rem)] w-auto shrink-0"
      />
      <BubbleBody
        className="flex max-w-md flex-col items-start px-4 py-3 text-[0.9375rem] min-[30rem]:text-base"
        tailClassName="top-1/2 -left-1.5 -translate-y-1/2"
      >
        <BubbleText flow={flow} ctaRef={ctaRef} />
      </BubbleBody>
    </div>
  );
}

function BubbleText({ flow, ctaRef }: SteveIntroProps) {
  switch (flow.phase) {
    case "idle":
      return <p>{IDLE_MESSAGE}</p>;
    case "thinking":
      return <TypingDots />;
    case "ready":
      return (
        <>
          <p>{READY_MESSAGE}</p>
          <Link
            ref={ctaRef}
            href={CAMPAIGN_PATH}
            className="mt-3 inline-flex min-h-11 items-center whitespace-nowrap rounded-2xl bg-yellow px-3 text-sm font-bold text-ink hover:bg-yellow/80 min-[30rem]:px-5"
          >
            Click here to review it
          </Link>
        </>
      );
    case "needs-detail":
      return <p>{flow.message}</p>;
  }
}
