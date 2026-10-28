import { describe, expect, it } from "vitest";
import type { Channel } from "@/types";
import {
  EMPTY_NAME_ERROR,
  INITIAL_SAVE_FLOW,
  NO_EMAIL_WARNING,
  NO_REACH_ERROR,
  NO_TEXT_WARNING,
  saveFlowReducer,
  validateGroupName,
  type SaveFlowState,
} from "./saveFlow";

const BOTH: Channel[] = ["sms", "email"];

function save(state: SaveFlowState, texted: number, mailed: number, channels = BOTH) {
  return saveFlowReducer(state, { type: "save", texted, mailed, channels });
}

describe("saveFlowReducer", () => {
  it("opens the naming modal when both channels can be reached", () => {
    expect(save(INITIAL_SAVE_FLOW, 5, 3)).toEqual({ phase: "idle", message: null, naming: true });
  });

  it("blocks saving when nobody can be texted or mailed", () => {
    expect(save(INITIAL_SAVE_FLOW, 0, 0)).toEqual({
      phase: "idle",
      message: { kind: "error", text: NO_REACH_ERROR },
      naming: false,
    });
  });

  it("keeps blocking on a second click with no reach", () => {
    const once = save(INITIAL_SAVE_FLOW, 0, 0);
    expect(save(once, 0, 0)).toEqual(once);
  });

  it("warns when nobody can be texted and the campaign sends texts", () => {
    expect(save(INITIAL_SAVE_FLOW, 0, 4)).toEqual({
      phase: "warned",
      message: { kind: "warning", text: NO_TEXT_WARNING },
      naming: false,
    });
  });

  it("warns when nobody can be mailed and the campaign sends emails", () => {
    expect(save(INITIAL_SAVE_FLOW, 4, 0).message).toEqual({
      kind: "warning",
      text: NO_EMAIL_WARNING,
    });
  });

  it("does not warn about a channel the campaign does not use", () => {
    expect(save(INITIAL_SAVE_FLOW, 0, 4, ["email"]).naming).toBe(true);
    expect(save(INITIAL_SAVE_FLOW, 4, 0, ["sms"]).naming).toBe(true);
  });

  it("opens the naming modal on the second click and keeps the warning", () => {
    const warned = save(INITIAL_SAVE_FLOW, 0, 4);
    expect(save(warned, 0, 4)).toEqual({
      phase: "warned",
      message: { kind: "warning", text: NO_TEXT_WARNING },
      naming: true,
    });
  });

  it("skips the warning step and keeps it shown when reopening after Cancel", () => {
    let state = save(save(INITIAL_SAVE_FLOW, 0, 4), 0, 4);
    state = saveFlowReducer(state, { type: "closeNaming" });
    expect(state.naming).toBe(false);
    expect(state.message?.text).toBe(NO_TEXT_WARNING);
    expect(save(state, 0, 4).naming).toBe(true);
  });

  it("resets the warning and acknowledgement on any filter change", () => {
    const warned = save(INITIAL_SAVE_FLOW, 0, 4);
    const reset = saveFlowReducer(warned, { type: "reset" });
    expect(reset).toEqual(INITIAL_SAVE_FLOW);
    expect(save(reset, 0, 4).phase).toBe("warned");
  });

  it("clears an error on any filter change", () => {
    const blocked = save(INITIAL_SAVE_FLOW, 0, 0);
    expect(saveFlowReducer(blocked, { type: "reset" })).toEqual(INITIAL_SAVE_FLOW);
  });
});

describe("validateGroupName", () => {
  it.each(["", "   ", "\t\n "])("rejects %j", (name) => {
    expect(validateGroupName(name)).toEqual({ ok: false, error: EMPTY_NAME_ERROR });
  });

  it("trims the name", () => {
    expect(validateGroupName("  VIP regulars ")).toEqual({ ok: true, name: "VIP regulars" });
  });
});
