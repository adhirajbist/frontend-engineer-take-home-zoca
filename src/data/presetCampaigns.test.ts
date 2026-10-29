import { describe, expect, it } from "vitest";
import { isWithinLimit } from "@/lib/messageLimits";
import { FIRST_NAME_TOKEN } from "@/lib/renderMessage";
import { CAMPAIGN_NAME_MAX_LENGTH } from "@/lib/campaignName";
import { findSegment } from "@/lib/segments";
import { NEUTRAL_LINES } from "./agentLines";
import {
  buildAgentNotes,
  buildCampaignFromPreset,
  MAX_REASON_LENGTH,
  PRESET_CAMPAIGNS,
} from "./presetCampaigns";

const TODAY = new Date(2026, 9, 29); // 29 Oct 2026

describe.each(PRESET_CAMPAIGNS.map((preset) => [preset.id, preset] as const))(
  "%s",
  (_, preset) => {
    it("uses its label as both id and name", () => {
      expect(preset.id).toBe(preset.name);
    });

    it.each(["channelReason", "audienceReason", "timeReason"] as const)(
      "has a short %s in plain text",
      (key) => {
        const reason = preset[key];
        expect(reason.trim()).not.toBe("");
        expect(reason.length).toBeLessThanOrEqual(MAX_REASON_LENGTH);
        expect(reason).toMatch(/^[\x20-\x7E]*$/);
      },
    );

    it("never names a month in the group reason", () => {
      expect(preset.audienceReason).not.toMatch(
        /January|February|March|April|May|June|July|August|September|October|November|December/,
      );
    });

    it("gives every card a note: reasons where Steve picked, neutral lines everywhere", () => {
      expect(buildAgentNotes(preset.id)).toEqual({
        name: { neutral: NEUTRAL_LINES.name },
        channel: { reason: preset.channelReason, neutral: NEUTRAL_LINES.channel },
        content: { neutral: NEUTRAL_LINES.content },
        audience: { reason: preset.audienceReason, neutral: NEUTRAL_LINES.audience },
        time: { reason: preset.timeReason, neutral: NEUTRAL_LINES.time },
      });
    });

    it("has a name the owner could also type", () => {
      expect(preset.name.length).toBeLessThanOrEqual(CAMPAIGN_NAME_MAX_LENGTH);
    });

    it("has a text and an email within the limits, with the first name", () => {
      const { sms, email } = preset.messages;
      expect(isWithinLimit("sms", sms.text)).toBe(true);
      expect(isWithinLimit("emailSubject", email.subject)).toBe(true);
      expect(isWithinLimit("emailBody", email.body)).toBe(true);
      expect(sms.text).toContain(FIRST_NAME_TOKEN);
      expect(email.subject).toContain(FIRST_NAME_TOKEN);
      expect(email.body).toContain(FIRST_NAME_TOKEN);
    });

    it("has no opt-out line, curly quotes or emoji", () => {
      const { sms, email } = preset.messages;
      for (const text of [sms.text, email.subject, email.body]) {
        expect(text).not.toMatch(/stop|unsubscribe/i);
        expect(text).toMatch(/^[\x20-\x7E\n]*$/);
      }
    });

    it("points at a segment that exists", () => {
      const campaign = buildCampaignFromPreset(preset.id, TODAY);
      expect(campaign.audience?.type).toBe("segment");
      if (campaign.audience?.type !== "segment") return;
      expect(findSegment(campaign.audience.segmentId, [])).toBeDefined();
    });
  },
);

describe("NEUTRAL_LINES", () => {
  it("has a line for every card", () => {
    for (const line of Object.values(NEUTRAL_LINES)) expect(line.trim()).not.toBe("");
    expect(Object.keys(NEUTRAL_LINES).sort()).toEqual(
      ["audience", "channel", "content", "name", "time"],
    );
  });
});

describe("buildAgentNotes", () => {
  it("throws on an unknown preset", () => {
    expect(() => buildAgentNotes("nope")).toThrow();
  });
});

describe("buildCampaignFromPreset", () => {
  it("fills every field", () => {
    const campaign = buildCampaignFromPreset("Win back clients who haven't visited in 3 months", TODAY);
    expect(campaign).toEqual({
      id: "Win back clients who haven't visited in 3 months",
      name: "Win back clients who haven't visited in 3 months",
      status: "draft",
      channels: ["sms", "email"],
      messages: PRESET_CAMPAIGNS[0].messages,
      audience: { type: "segment", segmentId: "lapsed-90" },
      sendTime: { mode: "now" },
    });
  });

  it("picks the birthday group for the current month", () => {
    const inDecember = buildCampaignFromPreset("Birthday treat", new Date(2026, 11, 31));
    const inJanuary = buildCampaignFromPreset("Birthday treat", new Date(2027, 0, 1));
    expect(inDecember.audience).toEqual({ type: "segment", segmentId: "birthday-month-12" });
    expect(inJanuary.audience).toEqual({ type: "segment", segmentId: "birthday-month-1" });
  });

  it("returns a deep copy every time", () => {
    const preset = PRESET_CAMPAIGNS[0];
    const a = buildCampaignFromPreset(preset.id, TODAY);
    const b = buildCampaignFromPreset(preset.id, TODAY);
    expect(a).toEqual(b);
    for (const campaign of [a, b]) {
      expect(campaign.channels).not.toBe(preset.channels);
      expect(campaign.messages).not.toBe(preset.messages);
      expect(campaign.messages.sms).not.toBe(preset.messages.sms);
      expect(campaign.messages.email).not.toBe(preset.messages.email);
    }
    expect(a.channels).not.toBe(b.channels);
    expect(a.messages.sms).not.toBe(b.messages.sms);
    expect(a.messages.email).not.toBe(b.messages.email);
    expect(a.audience).not.toBe(b.audience);
    expect(a.sendTime).not.toBe(b.sendTime);
  });

  it("throws on an unknown preset", () => {
    expect(() => buildCampaignFromPreset("nope", TODAY)).toThrow();
  });
});
