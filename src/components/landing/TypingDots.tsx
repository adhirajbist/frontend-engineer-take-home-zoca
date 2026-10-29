const DELAYS_MS = [0, 150, 300];

/** Three bouncing dots in the bubble's text colour. Static under reduced motion. */
export function TypingDots() {
  return (
    <span aria-hidden="true" className="flex h-[1.375em] items-center gap-1.5">
      {DELAYS_MS.map((delay) => (
        <span
          key={delay}
          className="size-2 rounded-full bg-current motion-safe:animate-typing-dot"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}
