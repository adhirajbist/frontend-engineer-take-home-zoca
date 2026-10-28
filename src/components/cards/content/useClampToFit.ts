import { useLayoutEffect, useRef, useState } from "react";

/**
 * Cuts text off with "…" when it does not fit the space it is given, so the
 * card never scrolls. The element needs the `fitText` classes and must be able
 * to shrink (min-h-0 down a chain of flex columns) inside a box marked
 * data-fit-box, whose size does not depend on the text.
 * Returns the ref and whether the text is currently cut off.
 */
export function useClampToFit<T extends HTMLElement>(text: string) {
  const ref = useRef<T>(null);
  const [clamped, setClamped] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.closest("[data-fit-box]");
    if (!el || !box) return;
    const target = el;

    function fit() {
      target.style.webkitLineClamp = "";
      const overflows = target.scrollHeight > target.clientHeight + 1;
      if (overflows) {
        const lineHeight = parseFloat(getComputedStyle(target).lineHeight);
        const lines = Math.max(1, Math.floor(target.clientHeight / lineHeight));
        target.style.webkitLineClamp = String(lines);
      }
      setClamped(overflows);
    }

    // The observer also fires once right away, so this covers the first fit.
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [text]);

  return [ref, clamped] as const;
}

/** Classes useClampToFit relies on: a shrinkable, line-clampable block. */
export const fitText =
  "min-h-0 overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical]";
