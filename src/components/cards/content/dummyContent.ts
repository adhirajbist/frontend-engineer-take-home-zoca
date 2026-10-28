import type { Channel } from "@/types";

/**
 * TEMPORARY: the channels picked in card 2, until that card exists.
 * To test one channel, change this to ["sms"] or ["email"].
 */
export const CAMPAIGN_CHANNELS: readonly [Channel, ...Channel[]] = ["sms", "email"];

/** Sample client the preview is shown for. */
export const SAMPLE_FIRST_NAME = "Priya";

export const SENDER_NAME = "Lumen Hair & Spa";
