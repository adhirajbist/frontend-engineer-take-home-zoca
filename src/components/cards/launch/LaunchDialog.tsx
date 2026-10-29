"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, type RefObject } from "react";
import { AgentDialog } from "@/components/AgentDialog";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/custom-group/buttonStyles";
import { getLaunchMessage } from "@/lib/launch";
import { CONFIRM_MESSAGE, getDoneMessage, type LaunchFlow } from "@/lib/launchFlow";

/** Loaded only when needed, so motion is not in the main bundle. */
const RocketLaunch = dynamic(() => import("./RocketLaunch"), { ssr: false });

/** Starts loading the rocket early, e.g. when the dialog opens. */
export function preloadRocket() {
  void import("./RocketLaunch");
}

/** If the rocket never loads (e.g. offline), the launch still finishes. */
const FALLBACK_MS = 5000;

type LaunchDialogProps = {
  flow: LaunchFlow;
  onConfirm: () => void;
  onFinished: () => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
};

export function LaunchDialog({
  flow,
  onConfirm,
  onFinished,
  onClose,
  returnFocusRef,
}: LaunchDialogProps) {
  const okRef = useRef<HTMLButtonElement>(null);
  const { step } = flow;
  const launching = step.phase === "launching";

  useEffect(() => {
    if (step.phase === "done") okRef.current?.focus();
  }, [step.phase]);

  useEffect(() => {
    if (!launching) return;
    const timer = setTimeout(onFinished, FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [launching, onFinished]);

  const message =
    step.phase === "blocked"
      ? getLaunchMessage(step.reason)
      : step.phase === "done"
        ? getDoneMessage(step.outcome)
        : CONFIRM_MESSAGE;

  const announcement =
    step.phase === "launching"
      ? "Launching your campaign"
      : step.phase === "done"
        ? getDoneMessage(step.outcome)
        : "";

  // Confirm and launching show the same two buttons, so the dialog keeps its
  // size and Steve's avatar doesn't move while the rocket flies.
  const asking = step.phase === "confirm" || launching;

  return (
    <AgentDialog
      open={flow.open}
      onClose={onClose}
      message={message}
      initialFocusRef={okRef}
      returnFocusRef={returnFocusRef}
      busy={launching}
    >
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {launching && <RocketLaunch onFinished={onFinished} />}
      <div className={`mt-4 flex justify-end gap-3 ${launching ? "invisible" : ""}`}>
        {asking && (
          <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
            Cancel
          </button>
        )}
        <button
          ref={okRef}
          type="button"
          onClick={step.phase === "confirm" ? onConfirm : onClose}
          className={PRIMARY_BUTTON}
        >
          Okay
        </button>
      </div>
    </AgentDialog>
  );
}
