/**
 * How long the mock AI takes to answer. Simulates the real agent's response
 * time, so the waiting state can be seen and tested.
 */
export const AI_MOCK_DELAY_MS = 2000;

/** One-tap rewrites of a message. */
export const QUICK_ACTIONS = ["shorter", "friendlier", "moreUrgent"] as const;

export type QuickAction = (typeof QUICK_ACTIONS)[number];
