import type { Channel } from "@/types";

/** The URL says "text"; the code says "sms". This is the only place they meet. */
const CHANNEL_SLUGS: Record<Channel, string> = { sms: "text", email: "email" };

export function editMessagePath(channel: Channel): string {
  return `/content/edit/${CHANNEL_SLUGS[channel]}`;
}

/** CardStack reads the hash and jumps straight to the Content card. */
export const CONTENT_CARD = "/#step-3";
