import type { MessageField } from "@/lib/messageLimits";

/**
 * DUMMY DATA: the campaign's starting messages, within MESSAGE_LIMITS, until
 * they come from the store. The Content card and the editor both start here.
 */
export const DUMMY_MESSAGES: Record<MessageField, string> = {
  sms: "Hi {{first_name}}, we miss you at Lumen! Book a visit this week and get 15% off any service. Tap to book: lumen.co/book",
  emailSubject: "{{first_name}}, your 15% off ends Sunday",
  emailBody:
    "Hi {{first_name}},\n\nIt’s been a while and we’d love to see you again. Book any service before Sunday and get 15% off, our thank-you for being a Lumen client.\n\nPick a time that suits you at lumen.co/book.\n\nSee you soon,\nThe Lumen team",
};
