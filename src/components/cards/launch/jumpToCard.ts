/**
 * Scrolls the card stack to a card and moves focus to its heading. Uses the
 * same snap markers as the "/#step-N" links; the stack's CSS scroll-behavior
 * makes it smooth, or instant when the owner prefers reduced motion.
 */
export function jumpToCard(step: number) {
  document.getElementById(`step-${step}`)?.scrollIntoView({ block: "start" });
  document.getElementById(`step-${step}-title`)?.focus({ preventScroll: true });
}
