"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

type CardStackProps = {
  count: number;
  children: ReactNode;
};

const NEXT_KEYS = ["ArrowDown", "PageDown"];
const PREV_KEYS = ["ArrowUp", "PageUp"];

function keyDirection(event: KeyboardEvent): 1 | -1 | 0 {
  if (NEXT_KEYS.includes(event.key)) return 1;
  if (PREV_KEYS.includes(event.key)) return -1;
  if (event.key === " ") return event.shiftKey ? -1 : 1;
  return 0;
}

/** Keys that belong to the focused element and must not move the stack. */
function isOwnedByTarget(event: KeyboardEvent): boolean {
  if (!(event.target instanceof Element)) return false;
  if (event.target.closest("input, textarea, select, [contenteditable='true']")) {
    return true;
  }
  return (
    event.key === " " &&
    event.target.closest("button, a, summary, [role='button']") !== null
  );
}

/** True if an element between target and stack can still scroll that way. */
function innerCanScroll(target: EventTarget | null, stack: HTMLElement, dir: 1 | -1) {
  let el = target instanceof Element ? target : null;
  while (el && el !== stack) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === "auto" || overflowY === "scroll") {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if (dir === 1 ? !atBottom : !atTop) return true;
    }
    el = el.parentElement;
  }
  return false;
}

/** Index of the snap marker closest to its resting position. */
function currentIndex(stack: HTMLElement, markers: HTMLElement[]) {
  const stackTop = stack.getBoundingClientRect().top;
  let best = 0;
  let bestDistance = Infinity;
  markers.forEach((marker, index) => {
    const margin = parseFloat(getComputedStyle(marker).scrollMarginTop);
    const distance = Math.abs(marker.getBoundingClientRect().top - stackTop - margin);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

/**
 * Scroller that fills the screen below the top bar and snaps one card at a
 * time, Reels style.
 * Cards stack using position: sticky (see StackCard).
 */
export function CardStack({ count, children }: CardStackProps) {
  const stackRef = useRef<HTMLElement>(null);

  // A hash like "/campaign#step-4" (from "Back to campaign") jumps to that card before
  // the first paint: no smooth scroll, no flash of card 1. Next.js keeps this
  // page alive with Activity and re-runs layout effects when it shows it again.
  useLayoutEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "instant" });
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const stack = stackRef.current;
      const dir = keyDirection(event);
      if (!stack || dir === 0) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (isOwnedByTarget(event) || innerCanScroll(event.target, stack, dir)) return;

      const markers = Array.from(stack.querySelectorAll<HTMLElement>("[data-stack-snap]"));
      const next = currentIndex(stack, markers) + dir;
      event.preventDefault();
      // Smoothness comes from the CSS scroll-behavior, which is reduced-motion aware.
      markers[next]?.scrollIntoView({ block: "start" });
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // The stack starts below the top bar, so only its height knows about the bar.
  // Sticky tops and snap margins measure from the stack's own top edge.
  const cardHeight = {
    "--card-h": `calc(var(--stack-h) - 2 * var(--pad-y) - ${count - 1} * var(--strip))`,
  } as CSSProperties;

  return (
    <main
      ref={stackRef}
      className="h-(--stack-h) snap-y snap-mandatory overflow-y-auto overscroll-none px-4 [--stack-h:calc(var(--screen)-var(--app-header-h))] [--pad-y:1rem] [--strip:14px] motion-safe:scroll-smooth sm:px-6 sm:[--pad-y:1.5rem] lg:px-10 compact:[--pad-y:0.5rem] compact:[--strip:8px]"
      style={cardHeight}
    >
      {/* One width for the whole stack, so the strips line up with the card in front. */}
      <div className="mx-auto max-w-2xl py-(--pad-y)">{children}</div>
    </main>
  );
}
