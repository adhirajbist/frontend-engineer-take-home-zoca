import type { Channel } from "@/types";

/**
 * TEMPORARY: the channels picked in card 2, until that card exists.
 * To test one channel, change this to ["sms"] or ["email"].
 */
export const CAMPAIGN_CHANNELS: readonly [Channel, ...Channel[]] = ["sms", "email"];

/** DUMMY DATA: placeholder messages, within MESSAGE_LIMITS, until the editor exists. */
export const DUMMY_CONTENT = {
  smsMessage:
    "Hi {{first_name}}, we miss you at Lumen! Book a visit this week and get 15% off any service. Tap to book: lumen.co/book",
  emailSubject: "{{first_name}}, your 15% off ends Sunday",
  emailBody:
    "Hi {{first_name}},\n\nIt’s been a while and we’d love to see you again. Book any service before Sunday and get 15% off, our thank-you for being a Lumen client.\n\nPick a time that suits you at lumen.co/book.\n\nSee you soon,\nThe Lumen team",
};

/** Sample client the preview is shown for. */
export const SAMPLE_FIRST_NAME = "Priya";

export const SENDER_NAME = "Lumen Hair & Spa";
