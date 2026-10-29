import { describe, expect, it } from "vitest";
import type { LaunchCheck } from "./launch";
import {
  getDoneMessage,
  INITIAL_LAUNCH_FLOW,
  launchFlowReducer,
  type LaunchEvent,
  type LaunchFlow,
} from "./launchFlow";

const OK: LaunchCheck = { ok: true };
const NO_TEXT: LaunchCheck = { ok: false, reason: "no-text-reach" };
const PASSED: LaunchCheck = { ok: false, reason: "time-passed" };

function run(...events: LaunchEvent[]): LaunchFlow {
  return events.reduce(launchFlowReducer, INITIAL_LAUNCH_FLOW);
}

describe("opening", () => {
  it("asks to confirm when the check passes", () => {
    expect(run({ type: "open", check: OK })).toEqual({ open: true, step: { phase: "confirm" } });
  });

  it.each([NO_TEXT, PASSED])("is blocked with the reason when it fails (%o)", (check) => {
    expect(run({ type: "open", check })).toEqual({
      open: true,
      step: { phase: "blocked", reason: check.ok ? null : check.reason },
    });
  });

  it("ignores a second open", () => {
    const open = run({ type: "open", check: OK });
    expect(launchFlowReducer(open, { type: "open", check: NO_TEXT })).toBe(open);
  });
});

describe("confirming", () => {
  it("starts launching with the outcome", () => {
    expect(
      run({ type: "open", check: OK }, { type: "confirm", check: OK, outcome: "scheduled" }),
    ).toEqual({ open: true, step: { phase: "launching", outcome: "scheduled" } });
  });

  it("re-checks: a time that passed while the dialog was open blocks it", () => {
    expect(
      run({ type: "open", check: OK }, { type: "confirm", check: PASSED, outcome: "scheduled" }),
    ).toEqual({ open: true, step: { phase: "blocked", reason: "time-passed" } });
  });

  it("ignores a double click", () => {
    const launching = run(
      { type: "open", check: OK },
      { type: "confirm", check: OK, outcome: "sent" },
    );
    expect(launchFlowReducer(launching, { type: "confirm", check: OK, outcome: "sent" })).toBe(
      launching,
    );
  });

  it("does nothing when blocked or closed", () => {
    const blocked = run({ type: "open", check: NO_TEXT });
    expect(launchFlowReducer(blocked, { type: "confirm", check: OK, outcome: "sent" })).toBe(
      blocked,
    );
    expect(
      launchFlowReducer(INITIAL_LAUNCH_FLOW, { type: "confirm", check: OK, outcome: "sent" }),
    ).toBe(INITIAL_LAUNCH_FLOW);
  });
});

describe("finishing and closing", () => {
  const launching = run(
    { type: "open", check: OK },
    { type: "confirm", check: OK, outcome: "sent" },
  );

  it("goes from launching to done, keeping the outcome", () => {
    expect(launchFlowReducer(launching, { type: "finished" })).toEqual({
      open: true,
      step: { phase: "done", outcome: "sent" },
    });
  });

  it("can't be closed while launching", () => {
    expect(launchFlowReducer(launching, { type: "close" })).toBe(launching);
  });

  it("ignores finished outside launching", () => {
    const confirm = run({ type: "open", check: OK });
    expect(launchFlowReducer(confirm, { type: "finished" })).toBe(confirm);
  });

  it.each<[string, LaunchEvent[]]>([
    ["blocked", [{ type: "open", check: NO_TEXT }]],
    ["confirm", [{ type: "open", check: OK }]],
    ["done", [{ type: "open", check: OK }, { type: "confirm", check: OK, outcome: "sent" }, { type: "finished" }]],
  ])("closes from %s and keeps the step for the fade out", (_, events) => {
    const before = run(...events);
    expect(launchFlowReducer(before, { type: "close" })).toEqual({ ...before, open: false });
  });

  it("starts fresh when opened again", () => {
    const reopened = run(
      { type: "open", check: OK },
      { type: "confirm", check: OK, outcome: "sent" },
      { type: "finished" },
      { type: "close" },
      { type: "open", check: OK },
    );
    expect(reopened).toEqual({ open: true, step: { phase: "confirm" } });
  });
});

describe("getDoneMessage", () => {
  it("says scheduled or launched", () => {
    expect(getDoneMessage("scheduled")).toBe("The campaign has been scheduled successfully!");
    expect(getDoneMessage("sent")).toBe("The campaign has been launched successfully!");
  });
});
