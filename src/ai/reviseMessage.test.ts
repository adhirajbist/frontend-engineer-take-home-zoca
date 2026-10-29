import { describe, expect, it } from "vitest";
import { MESSAGE_VARIANTS } from "@/data/messageVariants";
import { PRESET_CAMPAIGNS } from "@/data/presetCampaigns";
import { customPromptResult, reviseMessage } from "./reviseMessage";

const presetId = PRESET_CAMPAIGNS[0].id;
const now = { delayMs: 0 };

describe("reviseMessage", () => {
  it("returns the text variant for a text message", async () => {
    const result = await reviseMessage({ presetId, channel: "sms", action: "shorter" }, now);
    expect(result).toEqual({ ok: true, value: MESSAGE_VARIANTS[presetId].sms.shorter });
  });

  it("returns the subject and body together for an email", async () => {
    const result = await reviseMessage({ presetId, channel: "email", action: "moreUrgent" }, now);
    expect(result).toEqual({ ok: true, value: MESSAGE_VARIANTS[presetId].email.moreUrgent });
  });

  it("says so when the campaign has no variants", async () => {
    const result = await reviseMessage({ presetId: "nope", channel: "sms", action: "friendlier" }, now);
    expect(result).toEqual({ ok: false, reason: "no-variant" });
  });
});

describe("customPromptResult", () => {
  it("returns the prompt exactly as typed", async () => {
    const prompt = "  Hi {{first_name}},\n20% off  ";
    expect(await customPromptResult({ prompt }, now)).toBe(prompt);
  });
});
