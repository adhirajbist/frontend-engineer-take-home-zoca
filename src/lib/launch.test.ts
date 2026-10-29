import { describe, expect, it } from "vitest";
import type { Channel, SendTime } from "@/types";
import { getLaunchCheck, getLaunchMessage, type LaunchBlockReason } from "./launch";

const NOW = new Date("2026-10-29T15:00:00.000Z");
const NOW_SEND: SendTime = { mode: "now" };
const FUTURE: SendTime = { mode: "scheduled", iso: "2026-10-29T15:01:00.000Z" };
const PAST: SendTime = { mode: "scheduled", iso: "2026-10-29T14:59:00.000Z" };
const SMS: Channel[] = ["sms"];
const EMAIL: Channel[] = ["email"];
const BOTH: Channel[] = ["sms", "email"];

function check(channels: Channel[], texted: number, mailed: number, sendTime = NOW_SEND) {
  return getLaunchCheck({ channels, sendTime }, { texted, mailed }, NOW);
}

describe("getLaunchCheck reach", () => {
  it.each<[string, Channel[], number, number, LaunchBlockReason | null]>([
    ["text, reachable", SMS, 5, 5, null],
    ["text, nobody", SMS, 0, 5, "no-text-reach"],
    ["text, nobody by email (not selected)", SMS, 5, 0, null],
    ["text, nobody at all", SMS, 0, 0, "no-text-reach"],
    ["email, reachable", EMAIL, 5, 5, null],
    ["email, nobody", EMAIL, 5, 0, "no-email-reach"],
    ["email, nobody by text (not selected)", EMAIL, 0, 5, null],
    ["email, nobody at all", EMAIL, 0, 0, "no-email-reach"],
    ["both, reachable", BOTH, 5, 5, null],
    ["both, nobody by text", BOTH, 0, 5, "no-text-reach"],
    ["both, nobody by email", BOTH, 5, 0, "no-email-reach"],
    ["both, nobody at all", BOTH, 0, 0, "no-reach"],
  ])("%s", (_, channels, texted, mailed, reason) => {
    expect(check(channels, texted, mailed)).toEqual(reason ? { ok: false, reason } : { ok: true });
  });
});

describe("getLaunchCheck send time", () => {
  it("allows now", () => {
    expect(check(BOTH, 5, 5, NOW_SEND)).toEqual({ ok: true });
  });

  it("allows a time still ahead, even under 5 minutes", () => {
    expect(check(BOTH, 5, 5, FUTURE)).toEqual({ ok: true });
  });

  it("blocks a time that has passed", () => {
    expect(check(BOTH, 5, 5, PAST)).toEqual({ ok: false, reason: "time-passed" });
  });

  it("blocks a time exactly now", () => {
    const exact: SendTime = { mode: "scheduled", iso: NOW.toISOString() };
    expect(check(BOTH, 5, 5, exact)).toEqual({ ok: false, reason: "time-passed" });
  });

  it("names the reach problem first when both apply", () => {
    expect(check(SMS, 0, 5, PAST)).toEqual({ ok: false, reason: "no-text-reach" });
  });

  it("treats no send time like now", () => {
    expect(getLaunchCheck({ channels: SMS, sendTime: null }, { texted: 1, mailed: 0 }, NOW)).toEqual({
      ok: true,
    });
  });
});

describe("getLaunchMessage", () => {
  it.each<[LaunchBlockReason, string]>([
    ["no-text-reach", "None of the clients in this group can get a text. Please edit the group or the channel before launching."],
    ["no-email-reach", "None of the clients in this group can get an email. Please edit the group or the channel before launching."],
    ["no-reach", "None of the clients in this group can get a text or an email. Please edit the group or the channel before launching."],
    ["time-passed", "The time you picked has already passed. Please pick a new send time."],
  ])("%s", (reason, text) => {
    expect(getLaunchMessage(reason)).toBe(text);
  });
});
