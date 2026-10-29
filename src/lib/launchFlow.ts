/**
 * The launch dialog's steps, as a pure reducer.
 * blocked: Steve says why it can't launch. confirm: Steve asks to confirm.
 * launching: the rocket flies; nothing can close the dialog. done: success.
 */
import type { LaunchBlockReason, LaunchCheck } from "@/lib/launch";
import type { CampaignStatus } from "@/types";

export type LaunchOutcome = Exclude<CampaignStatus, "draft">;

export type LaunchStep =
  | { phase: "blocked"; reason: LaunchBlockReason }
  | { phase: "confirm" }
  | { phase: "launching"; outcome: LaunchOutcome }
  | { phase: "done"; outcome: LaunchOutcome };

/** The step is kept after closing, so the dialog's text doesn't change while it fades out. */
export type LaunchFlow = { open: boolean; step: LaunchStep };

export type LaunchEvent =
  | { type: "open"; check: LaunchCheck }
  | { type: "confirm"; check: LaunchCheck; outcome: LaunchOutcome }
  | { type: "finished" }
  | { type: "close" };

export const INITIAL_LAUNCH_FLOW: LaunchFlow = { open: false, step: { phase: "confirm" } };

function blockedOr(check: LaunchCheck, ok: LaunchStep): LaunchStep {
  return check.ok ? ok : { phase: "blocked", reason: check.reason };
}

/** Returns the same object when the event doesn't apply, e.g. a second click on Okay. */
export function launchFlowReducer(flow: LaunchFlow, event: LaunchEvent): LaunchFlow {
  switch (event.type) {
    case "open":
      if (flow.open) return flow;
      return { open: true, step: blockedOr(event.check, { phase: "confirm" }) };
    case "confirm":
      if (!flow.open || flow.step.phase !== "confirm") return flow;
      return {
        open: true,
        step: blockedOr(event.check, { phase: "launching", outcome: event.outcome }),
      };
    case "finished":
      if (flow.step.phase !== "launching") return flow;
      return { open: true, step: { phase: "done", outcome: flow.step.outcome } };
    case "close":
      if (!flow.open || flow.step.phase === "launching") return flow;
      return { ...flow, open: false };
  }
}

export const CONFIRM_MESSAGE = "Hey! Press okay to confirm the launch.";

const DONE_MESSAGES: Record<LaunchOutcome, string> = {
  scheduled: "The campaign has been scheduled successfully!",
  sent: "The campaign has been launched successfully!",
};

export function getDoneMessage(outcome: LaunchOutcome): string {
  return DONE_MESSAGES[outcome];
}
