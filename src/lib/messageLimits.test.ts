import { describe, expect, it } from "vitest";
import {
  FIRST_NAME_MAX_LENGTH,
  MESSAGE_LIMITS,
  OPT_OUT_LINE,
  countCharacters,
  isWithinLimit,
  remainingCharacters,
} from "./messageLimits";

describe("countCharacters", () => {
  it("counts an empty string as 0", () => {
    expect(countCharacters("")).toBe(0);
  });

  it("counts every space, including runs of them", () => {
    expect(countCharacters("a  b   c")).toBe(8);
  });

  it("counts a newline as one character", () => {
    expect(countCharacters("a\nb")).toBe(3);
    expect(countCharacters("a\r\nb")).toBe(3);
  });

  it("counts emoji the way they look, not by UTF-16 units", () => {
    expect(countCharacters("💇")).toBe(1);
    expect(countCharacters("👩🏽‍🦱")).toBe(1);
    expect(countCharacters("🇮🇳")).toBe(1);
    expect(countCharacters("Hi 💅🏻!")).toBe(5);
  });

  it("counts the first name token as a long first name", () => {
    expect(countCharacters("{{first_name}}")).toBe(FIRST_NAME_MAX_LENGTH);
    expect(countCharacters("Hi {{first_name}}, {{first_name}}")).toBe(5 + 2 * 15);
  });

  it("counts a broken token as plain text", () => {
    expect(countCharacters("{{first_name}")).toBe(13);
  });
});

describe("SMS limit", () => {
  it("allows exactly 135 characters and rejects 136", () => {
    expect(isWithinLimit("sms", "W".repeat(135))).toBe(true);
    expect(isWithinLimit("sms", "W".repeat(136))).toBe(false);
  });

  it("applies the token rule", () => {
    const fits = "{{first_name}}" + "a".repeat(135 - 15);
    expect(isWithinLimit("sms", fits)).toBe(true);
    expect(isWithinLimit("sms", fits + "a")).toBe(false);
  });

  it("does not count the opt-out line", () => {
    expect(OPT_OUT_LINE.length).toBe(25);
    expect(MESSAGE_LIMITS.sms + OPT_OUT_LINE.length).toBe(160);
  });
});

describe("email limits", () => {
  it("allows 50 subject and 250 body characters", () => {
    expect(isWithinLimit("emailSubject", "M".repeat(50))).toBe(true);
    expect(isWithinLimit("emailSubject", "M".repeat(51))).toBe(false);
    expect(isWithinLimit("emailBody", "M".repeat(250))).toBe(true);
    expect(isWithinLimit("emailBody", "M".repeat(251))).toBe(false);
  });
});

describe("remainingCharacters", () => {
  it("counts down and goes negative when over", () => {
    expect(remainingCharacters("sms", "")).toBe(135);
    expect(remainingCharacters("sms", "W".repeat(135))).toBe(0);
    expect(remainingCharacters("emailSubject", "M".repeat(52))).toBe(-2);
  });
});
