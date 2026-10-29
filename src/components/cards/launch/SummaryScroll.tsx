"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scrolls its content when the card is too short, with a fade at the bottom
 * while there is more below. Overscroll chains to the card stack, so the
 * page keeps scrolling once the list reaches its end.
 */
export function SummaryScroll({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () =>
      setMoreBelow(element.scrollTop + element.clientHeight < element.scrollHeight - 1);
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* -mx/px: room for the edit buttons' focus rings, which would be clipped. */}
      <div
        ref={ref}
        tabIndex={0}
        role="region"
        aria-label={label}
        className="-mx-2 min-h-0 flex-1 overflow-y-auto rounded-lg px-2"
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-white to-transparent motion-safe:transition-opacity ${moreBelow ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
