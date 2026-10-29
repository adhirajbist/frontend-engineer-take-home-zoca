import type { AgentCardKey } from "@/types";

/** What Steve always says on each card, under any reason. */
export const NEUTRAL_LINES: Record<AgentCardKey, string> = {
  name: "Hey! Scroll down to review the campaign.",
  channel: "You can change it by selecting the preferred channel.",
  // The "Edit message" button follows it in the card.
  content: "Want a different message?",
  // The "Edit clients" button follows it in the card.
  audience: "Want to change who gets this?",
  time: "You can change it by choosing Now or Later.",
};
