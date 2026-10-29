/** Shared so Save as and Done look identical. */
export const PRIMARY_BUTTON =
  "min-h-11 rounded-lg bg-burgundy px-4 text-sm font-bold text-cream hover:bg-plum";

export const SECONDARY_BUTTON =
  "min-h-11 rounded-lg border border-ink/20 bg-white px-4 text-sm font-bold text-ink hover:bg-ink/5";

/**
 * Matches Steve's chat bubble: cream on aubergine. Colours, shape and focus
 * only; each use adds its size. Focus shows the usual purple outline outside
 * (for the white card) and a cream ring inside (for the dark button).
 */
export const AGENT_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-full bg-aubergine font-bold text-cream hover:bg-burgundy active:bg-ink focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cream disabled:cursor-not-allowed disabled:opacity-70 motion-safe:transition-colors";
