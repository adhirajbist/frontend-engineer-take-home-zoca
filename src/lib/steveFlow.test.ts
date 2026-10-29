import { describe, expect, it } from "vitest";
import { formatNeedsDetailMessage, type SteveReply } from "@/ai/steve";
import {
  getAnnouncement,
  INITIAL_STEVE_FLOW,
  isBusy,
  steveFlowReducer,
  type SteveEvent,
  type SteveFlow,
} from "./steveFlow";

const READY: SteveReply = { kind: "ready", presetId: "win-back" };
const NEEDS: SteveReply = { kind: "needs-detail", missing: ["channel"] };

function run(...events: SteveEvent[]): SteveFlow {
  return events.reduce(steveFlowReducer, INITIAL_STEVE_FLOW);
}

const send: SteveEvent = { type: "send" };
const reply = (request: number, steveReply: SteveReply): SteveEvent => ({
  type: "reply",
  request,
  reply: steveReply,
});

describe("steveFlowReducer", () => {
  it("starts idle and not busy", () => {
    expect(INITIAL_STEVE_FLOW.phase).toBe("idle");
    expect(isBusy(INITIAL_STEVE_FLOW)).toBe(false);
  });

  it("goes idle, thinking, ready", () => {
    const thinking = run(send);
    expect(thinking).toEqual({ phase: "thinking", request: 1 });
    expect(steveFlowReducer(thinking, reply(1, READY))).toEqual({
      phase: "ready",
      request: 1,
      presetId: "win-back",
    });
  });

  it("goes idle, thinking, needs-detail with the message", () => {
    expect(run(send, reply(1, NEEDS))).toEqual({
      phase: "needs-detail",
      request: 1,
      message: formatNeedsDetailMessage(["channel"]),
    });
  });

  it("ignores a reply to an older request", () => {
    const flow = run(send, send, reply(1, READY));
    expect(flow).toEqual({ phase: "thinking", request: 2 });
    expect(steveFlowReducer(flow, reply(2, NEEDS)).phase).toBe("needs-detail");
  });

  it("ignores a reply once it is no longer thinking", () => {
    const done = run(send, reply(1, NEEDS));
    expect(steveFlowReducer(done, reply(1, READY))).toBe(done);
  });

  it("lets the owner ask again from ready or needs-detail", () => {
    expect(run(send, reply(1, READY), send)).toEqual({ phase: "thinking", request: 2 });
    expect(run(send, reply(1, NEEDS), send)).toEqual({ phase: "thinking", request: 2 });
  });

  it("is busy (input and list disabled) only while thinking", () => {
    expect(isBusy(run(send))).toBe(true);
    expect(isBusy(run(send, reply(1, READY)))).toBe(false);
    expect(isBusy(run(send, reply(1, NEEDS)))).toBe(false);
  });
});

describe("getAnnouncement", () => {
  it("says nothing on idle, then each state", () => {
    expect(getAnnouncement(INITIAL_STEVE_FLOW)).toBe("");
    expect(getAnnouncement(run(send))).toBe("Steve is typing");
    expect(getAnnouncement(run(send, reply(1, READY)))).toBe("Our campaign is ready!");
    expect(getAnnouncement(run(send, reply(1, NEEDS)))).toBe(formatNeedsDetailMessage(["channel"]));
  });
});
