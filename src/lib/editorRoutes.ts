import type { Channel } from "@/types";

/** The URL says "text"; the code says "sms". This is the only place they meet. */
const CHANNEL_SLUGS: Record<Channel, string> = { sms: "text", email: "email" };

export function editMessagePath(channel: Channel): string {
  return `/content/edit/${CHANNEL_SLUGS[channel]}`;
}

/** The card stack. Add a "#step-N" hash to land on a card. */
export const CAMPAIGN_PATH = "/campaign";

/** CardStack reads the hash and jumps straight to the Content card. */
export const CONTENT_CARD = `${CAMPAIGN_PATH}#step-3`;

/** CardStack reads the hash and jumps straight to the Audience card. */
export const AUDIENCE_CARD = `${CAMPAIGN_PATH}#step-4`;
