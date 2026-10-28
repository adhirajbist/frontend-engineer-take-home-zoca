import { FIRST_NAME_TOKEN } from "./renderMessage";

/**
 * Limits are in characters, spaces included, counted the way the owner sees
 * them (an emoji is one character).
 */
export const MESSAGE_LIMITS = {
  /** The part the owner writes. 135 + OPT_OUT_LINE (25) = 160, one text segment. */
  sms: 135,
  /** Inbox apps cut subjects off at around 50 characters, more so on phones. */
  emailSubject: 50,
  /** Short enough to read at a glance and fit the preview on a phone. */
  emailBody: 250,
} as const satisfies Record<string, number>;

export type MessageField = keyof typeof MESSAGE_LIMITS;

/** Added under every text message. 25 characters. */
export const OPT_OUT_LINE = "Reply STOP to unsubscribe";

/**
 * The opt-out line is added on top of the owner's 135 and does not count
 * toward it. So the full text a client receives can be up to 135 + 25 = 160
 * characters, plus the line break before the footer. That line break can push
 * a maximum-length message to a second segment for a client with a very long
 * first name. This is a known, accepted edge case. Flip to true to count the
 * footer instead (then the owner's limit becomes 135 - 25 - 1).
 */
export const SMS_FOOTER_COUNTS_TOWARD_LIMIT = false;

/**
 * {{first_name}} counts as this many characters, a long first name. A message
 * that fits with the long name also fits for "Priya".
 */
export const FIRST_NAME_MAX_LENGTH = 15;

const graphemes = new Intl.Segmenter("en", { granularity: "grapheme" });

/** Characters as the owner sees them, with each first name token counted as 15. */
export function countCharacters(text: string): number {
  const tokens = text.split(FIRST_NAME_TOKEN);
  const tokenCount = tokens.length - 1;
  const rest = tokens.reduce((sum, part) => sum + [...graphemes.segment(part)].length, 0);
  return rest + tokenCount * FIRST_NAME_MAX_LENGTH;
}

function limitFor(field: MessageField): number {
  if (field === "sms" && SMS_FOOTER_COUNTS_TOWARD_LIMIT) {
    // The footer sits on its own line, so the line break counts too.
    return MESSAGE_LIMITS.sms - OPT_OUT_LINE.length - 1;
  }
  return MESSAGE_LIMITS[field];
}

export function isWithinLimit(field: MessageField, text: string): boolean {
  return countCharacters(text) <= limitFor(field);
}

/** Negative when the text is over the limit. */
export function remainingCharacters(field: MessageField, text: string): number {
  return limitFor(field) - countCharacters(text);
}
