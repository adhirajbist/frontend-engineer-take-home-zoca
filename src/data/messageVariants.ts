import type { QuickAction } from "@/ai/constants";
import type { Channel, EmailMessage } from "@/types";

/** What one channel's message is: a text, or an email's subject and body. */
export type ChannelMessage = { sms: string; email: EmailMessage };

export type MessageVariants = { [C in Channel]: Record<QuickAction, ChannelMessage[C]> };

/**
 * Ready-made rewrites of each preset campaign's messages, keyed by the preset
 * id (which is also the campaign id). Used by the mock AI. They fit
 * MESSAGE_LIMITS and keep the presets' facts: no new offers, prices or dates.
 */
export const MESSAGE_VARIANTS: Readonly<Record<string, MessageVariants>> = {
  "Win back clients who haven't visited in 3 months": {
    sms: {
      shorter: "Hi {{first_name}}, we miss you at Lumen Hair & Spa! Book your next visit anytime.",
      friendlier:
        "Hi {{first_name}}! We've been thinking of you at Lumen Hair & Spa. Come say hi and let us treat you to a fresh look soon.",
      moreUrgent:
        "Hi {{first_name}}, it's been too long! Book your Lumen Hair & Spa visit this week while there's still room.",
    },
    email: {
      shorter: {
        subject: "We miss you, {{first_name}}",
        body: "Hi {{first_name}},\n\nIt's been a while since your last visit to Lumen Hair & Spa, and we'd love to see you again. Book whenever you're ready.\n\nThe Lumen team",
      },
      friendlier: {
        subject: "{{first_name}}, we've been thinking of you!",
        body: "Hi {{first_name}},\n\nWe've missed you at Lumen Hair & Spa! Whether it's a trim, a color refresh or a calm hour to yourself, we'd love to catch up and take care of you.\n\nHope to see you soon,\nThe Lumen team",
      },
      moreUrgent: {
        subject: "{{first_name}}, book your visit this week",
        body: "Hi {{first_name}},\n\nIt's been a few months since your last visit to Lumen Hair & Spa. Book this week while there's still room, and let us help you feel your best again.\n\nSee you soon,\nThe Lumen team",
      },
    },
  },
  "Fill empty slots this week": {
    sms: {
      shorter: "Hi {{first_name}}, Lumen Hair & Spa has a few open spots this week. Book now!",
      friendlier:
        "Hi {{first_name}}! A few spots just opened up at Lumen Hair & Spa this week, and we thought of you first. Want one?",
      moreUrgent:
        "Hi {{first_name}}, a few spots are left at Lumen Hair & Spa this week. Book today while there's still room!",
    },
    email: {
      shorter: {
        subject: "{{first_name}}, open spots this week",
        body: "Hi {{first_name}},\n\nA few spots just opened up at Lumen Hair & Spa this week. Grab a time that suits you before they're gone.\n\nThe Lumen team",
      },
      friendlier: {
        subject: "Good news, {{first_name}}: spots open this week",
        body: "Hi {{first_name}},\n\nGood news! A few appointments just opened up at Lumen Hair & Spa this week, and we wanted you to know first. We'd love to see you.\n\nPick a time that suits you,\nThe Lumen team",
      },
      moreUrgent: {
        subject: "{{first_name}}, book today before spots fill",
        body: "Hi {{first_name}},\n\nA few appointments opened up at Lumen Hair & Spa this week, and they won't last long. Book today while there's still room.\n\nThe Lumen team",
      },
    },
  },
  "Holiday gift cards": {
    sms: {
      shorter: "Hi {{first_name}}, Lumen Hair & Spa gift cards make an easy holiday gift.",
      friendlier:
        "Hi {{first_name}}! Need a holiday gift idea? A Lumen Hair & Spa gift card is a lovely way to treat someone you care about.",
      moreUrgent:
        "Hi {{first_name}}, the holidays are close! Pick up a Lumen Hair & Spa gift card this week and check a gift off your list.",
    },
    email: {
      shorter: {
        subject: "Gift idea, {{first_name}}?",
        body: "Hi {{first_name}},\n\nA Lumen Hair & Spa gift card makes an easy holiday gift, from a fresh cut to a calm spa visit. Ask at the front desk.\n\nThe Lumen team",
      },
      friendlier: {
        subject: "{{first_name}}, a little gift idea for you",
        body: "Hi {{first_name}},\n\nKnow someone who deserves some pampering? A Lumen Hair & Spa gift card lets them pick what they love, from a fresh cut to a calm spa visit. Just ask us at the front desk.\n\nHappy holidays,\nThe Lumen team",
      },
      moreUrgent: {
        subject: "{{first_name}}, get your gift cards this week",
        body: "Hi {{first_name}},\n\nThe holidays are getting close. Pick up a Lumen Hair & Spa gift card at the front desk this week, and give someone a fresh cut or a calm spa visit.\n\nHappy holidays,\nThe Lumen team",
      },
    },
  },
  "Birthday treat": {
    sms: {
      shorter: "Happy birthday month, {{first_name}}! Treat yourself to a visit to Lumen Hair & Spa.",
      friendlier:
        "Happy birthday month, {{first_name}}! All of us at Lumen Hair & Spa hope it's a great one. Come in and let us spoil you a little.",
      moreUrgent:
        "Happy birthday month, {{first_name}}! Book your Lumen Hair & Spa treat this week while there's still room.",
    },
    email: {
      shorter: {
        subject: "Happy birthday, {{first_name}}!",
        body: "Hi {{first_name}},\n\nHappy birthday month from Lumen Hair & Spa! Book a visit whenever suits you and take some time for yourself.\n\nThe Lumen team",
      },
      friendlier: {
        subject: "{{first_name}}, happy birthday from all of us!",
        body: "Hi {{first_name}},\n\nHappy birthday month! Everyone at Lumen Hair & Spa hopes it's a wonderful one. You deserve some time for yourself, so come in and let us help you feel your best.\n\nWarm wishes,\nThe Lumen team",
      },
      moreUrgent: {
        subject: "{{first_name}}, book your birthday treat today",
        body: "Hi {{first_name}},\n\nHappy birthday month from Lumen Hair & Spa! Don't let it slip by. Book your birthday treat this week while there's still room.\n\nWarm wishes,\nThe Lumen team",
      },
    },
  },
};
