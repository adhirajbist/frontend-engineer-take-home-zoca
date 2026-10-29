import { describe, expect, it } from "vitest";
import { PRESET_CAMPAIGNS } from "@/data/presetCampaigns";
import { askSteve, findMissingDetails, formatNeedsDetailMessage } from "./steve";

const WIN_BACK = PRESET_CAMPAIGNS[0].id;

function ask(prompt: string) {
  return askSteve(prompt, { delayMs: 0 });
}

describe("askSteve", () => {
  it.each([
    "custom campaign",
    "Custom Campaign please",
    "  CUSTOM CAMPAIGN  ",
    "Could you build me a custom campaign for the spring?",
  ])("is ready with the win-back campaign for %j", async (prompt) => {
    expect(WIN_BACK).toMatch(/^Win back/);
    await expect(ask(prompt)).resolves.toEqual({ kind: "ready", presetId: WIN_BACK });
  });

  it("asks for more detail otherwise", async () => {
    await expect(ask("custom   campaign")).resolves.toEqual({
      kind: "needs-detail",
      missing: ["content", "audience", "send time", "channel"],
    });
    await expect(ask("content and audience")).resolves.toEqual({
      kind: "needs-detail",
      missing: ["send time", "channel"],
    });
  });

  it("rejects when aborted, and never replies", async () => {
    const controller = new AbortController();
    const reply = askSteve("custom campaign", { delayMs: 50, signal: controller.signal });
    controller.abort();
    await expect(reply).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("findMissingDetails", () => {
  it.each([
    ["", ["content", "audience", "send time", "channel"]],
    ["content audience send time", ["channel"]],
    ["channel and audience", ["content", "send time"]],
    ["just the channel", ["content", "audience", "send time"]],
    ["content audience send time channel", []],
    ["CHANNEL, Send Time, AuDiEnCe, content", []],
    ["send  time", ["content", "audience", "send time", "channel"]],
  ])("%j is missing %j", (prompt, missing) => {
    expect(findMissingDetails(prompt)).toEqual(missing);
  });

  it("keeps the fixed order, whatever order the prompt uses", () => {
    expect(findMissingDetails("channel content")).toEqual(["audience", "send time"]);
  });
});

describe("formatNeedsDetailMessage", () => {
  const message = (list: string) =>
    "To get this exactly right, I just need a bit " +
    `more detail on ${list}. Could you share more about that?`;

  it.each([
    [["content"], "content"],
    [["content", "audience"], "content and audience"],
    [["content", "audience", "send time"], "content, audience, and send time"],
    [
      ["content", "audience", "send time", "channel"],
      "content, audience, send time, and channel",
    ],
    [[], "the campaign"],
  ])("%j reads %j", (missing, list) => {
    expect(formatNeedsDetailMessage(missing)).toBe(message(list));
  });
});
