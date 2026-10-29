/**
 * MOCK: stands in for the real agent until it exists. Replace reviseMessage
 * and customPromptResult with calls to the real agent; the result shapes below
 * are the contract the message editor relies on.
 *
 * The mock ignores the current message text on purpose: it returns a ready-made
 * variant of the preset campaign's message.
 */
import { MESSAGE_VARIANTS, type ChannelMessage, type MessageVariants } from "@/data/messageVariants";
import type { Channel } from "@/types";
import { AI_MOCK_DELAY_MS, type QuickAction } from "./constants";

export type ReviseResult<C extends Channel> =
  | { ok: true; value: ChannelMessage[C] }
  | { ok: false; reason: "no-variant" };

type MockOptions = {
  /** Tests pass 0. */
  delayMs?: number;
};

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function reviseMessage<C extends Channel>(
  request: { presetId: string; channel: C; action: QuickAction },
  { delayMs = AI_MOCK_DELAY_MS }: MockOptions = {},
): Promise<ReviseResult<C>> {
  await wait(delayMs);
  const variants = MESSAGE_VARIANTS[request.presetId];
  if (!variants) return { ok: false, reason: "no-variant" };
  const forChannel: MessageVariants[C] = variants[request.channel];
  return { ok: true, value: forChannel[request.action] };
}

/** Writes a message from the owner's description. The mock returns it exactly as typed. */
export async function customPromptResult(
  request: { prompt: string },
  { delayMs = AI_MOCK_DELAY_MS }: MockOptions = {},
): Promise<string> {
  await wait(delayMs);
  return request.prompt;
}
