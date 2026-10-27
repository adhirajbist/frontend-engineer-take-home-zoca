import type { ReactNode } from "react";

type StackCardProps = {
  step: number;
  title: string;
  children?: ReactNode;
};

/**
 * One full-height card in the CardStack. It sticks a little lower than the
 * card before it, so a strip of every earlier card stays visible.
 * Relies on --pad-y, --strip and --card-h set by CardStack.
 */
export function StackCard({ step, title, children }: StackCardProps) {
  const headingId = `step-${step}-title`;
  const offset = `calc(var(--pad-y) + ${step - 1} * var(--strip))`;

  return (
    <>
      {/* Snap point. Sticky elements make unreliable snap targets, so this
          plain marker sits where the card starts, offset by its sticky top. */}
      <div
        data-stack-snap
        aria-hidden="true"
        className="h-0 snap-start snap-always"
        style={{ scrollMarginTop: offset }}
      />
      <section
        aria-labelledby={headingId}
        className="sticky mb-(--strip) flex h-(--card-h) flex-col overflow-hidden rounded-3xl border border-ink/15 bg-white shadow-lg shadow-ink/10 last:mb-0"
        style={{ top: offset }}
      >
        <header className="shrink-0 px-5 pt-5 pb-3 sm:px-8 sm:pt-7">
          <p className="text-sm font-bold uppercase tracking-wide text-plum">
            Step {step}
          </p>
          <h2
            id={headingId}
            className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl"
          >
            {title}
          </h2>
        </header>
        {/* Scrolls on its own if content is taller than the card. Overscroll
            is left to chain to the page, so it never traps the swipe. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-8 sm:pb-7">
          {children}
        </div>
      </section>
    </>
  );
}
