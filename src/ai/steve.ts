/**
 * MOCK: stands in for the real Steve agent until it exists. Replace askSteve
 * with a call to the real agent; the reply shapes below are the contract the
 * landing page relies on.
 */
import { PRESET_CAMPAIGNS } from "@/data/presetCampaigns";

/** How long the mock pretends to think. */
export const MOCK_THINK_MS = 2600;

/** What the owner needs to tell Steve about, in the order he asks. */
export const DETAILS = ["content", "audience", "send time", "channel"] as const;

export type SteveReply =
  | { kind: "ready"; presetId: string }
  | { kind: "needs-detail"; missing: string[] };

const READY_PHRASE = "custom campaign";

/** The details the prompt does not mention, in DETAILS order. Case-insensitive. */
export function findMissingDetails(prompt: string): string[] {
  const text = prompt.toLowerCase();
  return DETAILS.filter((detail) => !text.includes(detail));
}

/** "a", "a and b", "a, b, and c". */
function joinList(items: readonly string[]): string {
  if (items.length <= 2) return items.join(" and ");
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function formatNeedsDetailMessage(missing: readonly string[]): string {
  const list = missing.length === 0 ? "the campaign" : joinList(missing);
  return (
    "To get this exactly right, I just need a bit " +
    `more detail on ${list}. Could you share more about that?`
  );
}

/** The reply without the wait. */
export function replyTo(prompt: string): SteveReply {
  if (prompt.trim().toLowerCase().includes(READY_PHRASE)) {
    return { kind: "ready", presetId: PRESET_CAMPAIGNS[0].id };
  }
  return { kind: "needs-detail", missing: findMissingDetails(prompt) };
}

type AskOptions = {
  /** Tests pass 0. */
  delayMs?: number;
  /** Aborting clears the timer and rejects with an AbortError. */
  signal?: AbortSignal;
};

export function askSteve(
  prompt: string,
  { delayMs = MOCK_THINK_MS, signal }: AskOptions = {},
): Promise<SteveReply> {
  return new Promise((resolve, reject) => {
    const abortError = () => new DOMException("Aborted", "AbortError");
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve(replyTo(prompt));
    }, delayMs);
    function onAbort() {
      clearTimeout(timer);
      reject(abortError());
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
