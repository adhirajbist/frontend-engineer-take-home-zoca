import type { ComponentProps } from "react";

type ShimmerBoxProps = ComponentProps<"div"> & {
  /** While true, a soft shimmer covers the content and it is marked busy. */
  active: boolean;
};

/**
 * A div that shows a shimmer over its content while the AI is working. Give
 * it the classes the wrapped box would have had: it only adds `relative` and
 * an overlay inside, so size and position stay the same and a focus outline
 * on the box itself is never covered. With reduced motion the overlay is a
 * still tint.
 */
export function ShimmerBox({ active, className = "", children, ...rest }: ShimmerBoxProps) {
  return (
    <div {...rest} aria-busy={active || undefined} className={`relative ${className}`}>
      {children}
      {active && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] bg-purple/8 motion-reduce:bg-purple/12"
        >
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/80 to-transparent motion-safe:animate-shimmer motion-reduce:hidden" />
        </div>
      )}
    </div>
  );
}
