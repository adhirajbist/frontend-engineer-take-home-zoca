import { birthdayMonthSegmentId } from "@/lib/segments";
import type { Campaign, Channel, EmailMessage, SmsMessage } from "@/types";

/** Stands in for "Clients born in <this month>", resolved when the campaign is picked. */
export const BIRTHDAY_THIS_MONTH = "birthday-this-month";

export type PresetCampaign = {
  /** Same as the name, the label the owner picks. */
  id: string;
  name: string;
  /** Which messages are sent. Both messages exist either way. */
  channels: Channel[];
  messages: { sms: SmsMessage; email: EmailMessage };
  /** A preset segment id, or BIRTHDAY_THIS_MONTH. */
  segmentId: string;
};

/** Ready-made campaigns. Messages fit MESSAGE_LIMITS; opt-out lines are added on send. */
export const PRESET_CAMPAIGNS: readonly PresetCampaign[] = [
  {
    id: "Win back clients who haven't visited in 3 months",
    name: "Win back clients who haven't visited in 3 months",
    channels: ["sms", "email"],
    messages: {
      sms: {
        text: "Hi {{first_name}}, it's been a while and we miss you at Lumen Hair & Spa! Ready for a fresh look? Book your next visit anytime.",
      },
      email: {
        subject: "{{first_name}}, we miss you at Lumen",
        body: "Hi {{first_name}},\n\nIt's been a few months since your last visit to Lumen Hair & Spa, and we'd love to see you again. Whether it's a trim, a color refresh or some time to relax, we're here when you're ready.\n\nSee you soon,\nThe Lumen team",
      },
    },
    segmentId: "lapsed-90",
  },
  {
    id: "Fill empty slots this week",
    name: "Fill empty slots this week",
    channels: ["sms"],
    messages: {
      sms: {
        text: "Hi {{first_name}}, we have a few open spots at Lumen Hair & Spa this week. Want one? Book now before they fill up.",
      },
      email: {
        subject: "{{first_name}}, a spot opened up this week",
        body: "Hi {{first_name}},\n\nA few appointments just opened up at Lumen Hair & Spa this week. You haven't booked your next visit yet, so we wanted you to hear first.\n\nGrab a time that suits you before they're gone.\n\nThe Lumen team",
      },
    },
    segmentId: "vip-no-next-appointment",
  },
  {
    id: "Holiday gift cards",
    name: "Holiday gift cards",
    channels: ["sms", "email"],
    messages: {
      sms: {
        text: "Hi {{first_name}}, still shopping for the holidays? Lumen Hair & Spa gift cards are a relaxing gift for anyone on your list.",
      },
      email: {
        subject: "{{first_name}}, a gift they'll love",
        body: "Hi {{first_name}},\n\nLooking for an easy holiday gift? A Lumen Hair & Spa gift card lets someone special choose what they love, from a fresh cut to a calm spa visit.\n\nAsk at the front desk next time you're in.\n\nHappy holidays,\nThe Lumen team",
      },
    },
    segmentId: "all-clients",
  },
  {
    id: "Birthday treat",
    name: "Birthday treat",
    channels: ["sms"],
    messages: {
      sms: {
        text: "Happy birthday month, {{first_name}}! Celebrate with a visit to Lumen Hair & Spa and treat yourself to a little time just for you.",
      },
      email: {
        subject: "Happy birthday month, {{first_name}}!",
        body: "Hi {{first_name}},\n\nHappy birthday month from all of us at Lumen Hair & Spa! Your birthday is a great excuse to take some time for yourself.\n\nBook a visit whenever suits you and let us help you feel your best.\n\nWarm wishes,\nThe Lumen team",
      },
    },
    segmentId: BIRTHDAY_THIS_MONTH,
  },
];

/** A fresh campaign from a preset. Shares nothing with the template. Throws on an unknown id. */
export function buildCampaignFromPreset(presetId: string, today: Date): Campaign {
  const preset = PRESET_CAMPAIGNS.find((campaign) => campaign.id === presetId);
  if (!preset) throw new Error(`Unknown preset campaign: ${presetId}`);
  const { id, name, channels, messages, segmentId } = structuredClone(preset);
  return {
    id,
    name,
    channels,
    messages,
    audience: {
      type: "segment",
      segmentId: segmentId === BIRTHDAY_THIS_MONTH ? birthdayMonthSegmentId(today) : segmentId,
    },
    sendTime: { mode: "now" },
  };
}
