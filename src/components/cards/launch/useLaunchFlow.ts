import { useCallback, useRef, useState } from "react";
import type { LaunchCheck } from "@/lib/launch";
import {
  INITIAL_LAUNCH_FLOW,
  launchFlowReducer,
  type LaunchEvent,
  type LaunchFlow,
  type LaunchOutcome,
} from "@/lib/launchFlow";

/**
 * The launch dialog's state. A ref holds the latest step, so a second click
 * before React re-renders still sees "launching" and changes nothing.
 */
export function useLaunchFlow() {
  const [flow, setFlow] = useState<LaunchFlow>(INITIAL_LAUNCH_FLOW);
  const latest = useRef(flow);

  const send = useCallback((event: LaunchEvent) => {
    const before = latest.current;
    const next = launchFlowReducer(before, event);
    if (next !== before) {
      latest.current = next;
      setFlow(next);
    }
    return { before, next };
  }, []);

  const open = useCallback((check: LaunchCheck) => send({ type: "open", check }), [send]);

  /** Calls onLaunch only if this click is the one that starts the launch. */
  const confirm = useCallback(
    (check: LaunchCheck, outcome: LaunchOutcome, onLaunch: () => void) => {
      const { before, next } = send({ type: "confirm", check, outcome });
      if (before.step.phase === "confirm" && next.step.phase === "launching") onLaunch();
    },
    [send],
  );

  const finish = useCallback(() => send({ type: "finished" }), [send]);
  const close = useCallback(() => send({ type: "close" }), [send]);

  return { flow, open, confirm, finish, close };
}
