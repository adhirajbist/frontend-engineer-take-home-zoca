import type { Channel } from "@/types";

export type SaveMessage = { kind: "error" | "warning"; text: string };

/** "warned" = the one-sided warning was shown, so the next Save as goes ahead. */
export type SavePhase = "idle" | "warned";

export type SaveFlowState = {
  phase: SavePhase;
  message: SaveMessage | null;
  naming: boolean;
};

export type SaveFlowAction =
  | { type: "save"; texted: number; mailed: number; channels: readonly Channel[] }
  | { type: "closeNaming" }
  /** Any change to the filters. */
  | { type: "reset" };

export const INITIAL_SAVE_FLOW: SaveFlowState = { phase: "idle", message: null, naming: false };

export const NO_REACH_ERROR = "No one in this group can get a text or an email. Try removing a filter.";

export const NO_TEXT_WARNING =
  "None of these clients can get a text, but your campaign sends texts. Click Save as again to save anyway.";

export const NO_EMAIL_WARNING =
  "None of these clients can get an email, but your campaign sends emails. Click Save as again to save anyway.";

export const EMPTY_NAME_ERROR = "Give this group a name so you can find it later.";

export const GROUP_NAME_MAX_LENGTH = 40;

/** The warning for a channel the campaign uses but nobody here can get, if any. */
function oneSidedWarning(texted: number, mailed: number, channels: readonly Channel[]) {
  if (texted === 0 && mailed > 0 && channels.includes("sms")) return NO_TEXT_WARNING;
  if (mailed === 0 && texted > 0 && channels.includes("email")) return NO_EMAIL_WARNING;
  return null;
}

export function saveFlowReducer(state: SaveFlowState, action: SaveFlowAction): SaveFlowState {
  switch (action.type) {
    case "save": {
      const { texted, mailed, channels } = action;
      if (texted === 0 && mailed === 0) {
        return { phase: "idle", message: { kind: "error", text: NO_REACH_ERROR }, naming: false };
      }
      const warning = oneSidedWarning(texted, mailed, channels);
      if (warning && state.phase === "idle") {
        return { phase: "warned", message: { kind: "warning", text: warning }, naming: false };
      }
      // Stay "warned" so reopening after Cancel skips the warning. The warning
      // itself stays visible until the filters change.
      return { ...state, naming: true };
    }
    case "closeNaming":
      return { ...state, naming: false };
    case "reset":
      return INITIAL_SAVE_FLOW;
  }
}

export type NameCheck = { ok: true; name: string } | { ok: false; error: string };

export function validateGroupName(name: string): NameCheck {
  const trimmed = name.trim();
  return trimmed ? { ok: true, name: trimmed } : { ok: false, error: EMPTY_NAME_ERROR };
}
