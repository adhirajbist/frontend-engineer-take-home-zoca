import type { ReactElement, ReactNode } from "react";

type StackCardProps = {
  step: number;
  title: string;
  /** Shown beside the title, wrapping under it on narrow screens. */
  headerAside?: ReactNode;
  /** Wraps the card's <section>, e.g. to make it a Radix Tabs root via asChild. */
  wrapSection?: (section: ReactElement) => ReactElement;
  children?: ReactNode;
};

/**
 * One full-height card in the CardStack. It sticks a little lower than the
 * card before it, so a strip of every earlier card stays visible.
 * Relies on --pad-y, --strip and --card-h set by CardStack.
 */
export function StackCard({ step, title, headerAside, wrapSection, children }: StackCardProps) {
  const headingId = `step-${step}-title`;
  const offset = `calc(var(--pad-y) + ${step - 1} * var(--strip))`;

  const section = (
    <section
      aria-labelledby={headingId}
      className="sticky mb-(--strip) flex h-(--card-h) flex-col overflow-hidden rounded-3xl border border-ink/15 bg-white shadow-lg shadow-ink/10 last:mb-0"
      style={{ top: offset }}
    >
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-x-4 gap-y-2 px-5 pt-5 pb-3 sm:px-8 sm:pt-7 short:pt-3 short:pb-2">
        {/* Grows to fill the row; headerAside only wraps below it when the
            title would get narrower than 12rem. */}
        <div className="min-w-0 flex-1 basis-48">
          <p className="text-sm font-bold uppercase tracking-wide text-plum short:text-xs">
            Step {step}
          </p>
          {/* Focusable from code, so "Edit" on the Launch card can land here. */}
          <h2
            id={headingId}
            tabIndex={-1}
            className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl short:mt-0 short:text-lg"
          >
            {title}
          </h2>
        </div>
        {headerAside}
      </header>
      {/* Scrolls on its own if content is taller than the card. Overscroll
          is left to chain to the page, so it never traps the swipe. A flex
          column, so an AgentBubble with atCardBottom sits at the bottom. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-5 sm:px-8 sm:pb-7 short:pb-3">
        {children}
      </div>
    </section>
  );

  return (
    <>
      {/* Snap point. Sticky elements make unreliable snap targets, so this
          plain marker sits where the card starts, offset by its sticky top. */}
      <div
        id={`step-${step}`}
        data-stack-snap
        aria-hidden="true"
        className="h-0 snap-start snap-always"
        style={{ scrollMarginTop: offset }}
      />
      {wrapSection ? wrapSection(section) : section}
    </>
  );
}
