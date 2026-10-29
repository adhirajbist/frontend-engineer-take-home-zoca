import type { ReactNode } from "react";

type BubbleBodyProps = {
  /** Padding, text size and anything else that differs per use. */
  className?: string;
  /** Where the tail sits, e.g. "-left-1.5 top-4". */
  tailClassName: string;
  children: ReactNode;
};

/** Steve's dark speech bubble with its tail. Shared by AgentBubble and the landing page. */
export function BubbleBody({ className = "", tailClassName, children }: BubbleBodyProps) {
  return (
    <div className={`relative min-w-0 rounded-2xl bg-aubergine leading-snug text-cream ${className}`}>
      {/* Tail pointing at Steve. */}
      <span
        aria-hidden="true"
        className={`absolute size-3 rotate-45 bg-aubergine ${tailClassName}`}
      />
      {children}
    </div>
  );
}
