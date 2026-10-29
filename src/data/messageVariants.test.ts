import { describe, expect, it } from "vitest";
import { QUICK_ACTIONS } from "@/ai/constants";
import { countCharacters, isWithinLimit } from "@/lib/messageLimits";
import { FIRST_NAME_TOKEN } from "@/lib/renderMessage";
import { MESSAGE_VARIANTS } from "./messageVariants";
import { PRESET_CAMPAIGNS } from "./presetCampaigns";

/** Same rules as the presets: no opt-out line, straight quotes, no emoji. */
function expectPlainText(text: string) {
  expect(text).not.toMatch(/stop|unsubscribe/i);
  expect(text).toMatch(/^[\x20-\x7E\n]*$/);
}

/** No new offers, prices, numbers or dates. */
function expectNoInventedFacts(text: string) {
  expect(text).not.toMatch(/\d|%|\$|discount|\bsale\b|free|deadline|only \w+ left/i);
}

describe.each(PRESET_CAMPAIGNS.map((preset) => [preset.id, preset] as const))(
  "%s",
  (id, preset) => {
    const variants = MESSAGE_VARIANTS[id];
    const base = preset.messages;

    it("has every quick edit for the text and the email", () => {
      expect(variants).toBeDefined();
      expect(Object.keys(variants.sms).sort()).toEqual([...QUICK_ACTIONS].sort());
      expect(Object.keys(variants.email).sort()).toEqual([...QUICK_ACTIONS].sort());
    });

    it.each(QUICK_ACTIONS)("%s fits the limits, with the first name", (action) => {
      const sms = variants.sms[action];
      const { subject, body } = variants.email[action];
      expect(isWithinLimit("sms", sms)).toBe(true);
      expect(isWithinLimit("emailSubject", subject)).toBe(true);
      expect(isWithinLimit("emailBody", body)).toBe(true);
      expect(sms).toContain(FIRST_NAME_TOKEN);
      expect(body).toContain(FIRST_NAME_TOKEN);
      for (const text of [sms, subject, body]) {
        expectPlainText(text);
        expectNoInventedFacts(text);
      }
    });

    it("shorter is shorter than the original in every field", () => {
      const { sms, email } = variants;
      expect(countCharacters(sms.shorter)).toBeLessThan(countCharacters(base.sms.text));
      expect(countCharacters(email.shorter.subject)).toBeLessThan(
        countCharacters(base.email.subject),
      );
      expect(countCharacters(email.shorter.body)).toBeLessThan(countCharacters(base.email.body));
    });

    it("more urgent asks to book or buy soon", () => {
      for (const text of [variants.sms.moreUrgent, variants.email.moreUrgent.body]) {
        expect(text).toMatch(/this week|today|while there's still room/);
      }
    });

    it("has three different variants, none the same as the original", () => {
      const texts = [base.sms.text, ...QUICK_ACTIONS.map((action) => variants.sms[action])];
      const subjects = [
        base.email.subject,
        ...QUICK_ACTIONS.map((action) => variants.email[action].subject),
      ];
      const bodies = [base.email.body, ...QUICK_ACTIONS.map((action) => variants.email[action].body)];
      for (const list of [texts, subjects, bodies]) expect(new Set(list).size).toBe(list.length);
    });
  },
);

it("has variants only for presets that exist", () => {
  const ids = PRESET_CAMPAIGNS.map((preset) => preset.id).sort();
  expect(Object.keys(MESSAGE_VARIANTS).sort()).toEqual(ids);
});
