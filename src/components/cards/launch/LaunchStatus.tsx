import { CircleCheck } from "lucide-react";
import { useRef, type RefObject } from "react";
import { AgentDialog } from "@/components/AgentDialog";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/custom-group/buttonStyles";
import { formatSendTime } from "@/lib/time";
import type { Channel, SendTime } from "@/types";

type LaunchStatusProps = {
  status: "scheduled" | "sent";
  channels: readonly Channel[];
  sendTime: SendTime | null;
  /** The status block itself, so the launch dialog can return focus here. */
  ref: RefObject<HTMLDivElement | null>;
  cancelButtonRef: RefObject<HTMLButtonElement | null>;
  /** Opens CancelScheduleDialog. */
  onCancelSchedule: () => void;
  onStartNew: () => void;
};

const WHO: Record<string, string> = {
  sms: "Texts",
  email: "Emails",
  "sms,email": "Texts and emails",
};

/** Shown instead of the Launch button once the campaign is scheduled or sent. */
export function LaunchStatus({
  status,
  channels,
  sendTime,
  ref,
  cancelButtonRef,
  onCancelSchedule,
  onStartNew,
}: LaunchStatusProps) {
  const scheduled = status === "scheduled";
  const when = scheduled ? "at the scheduled time" : "right away";
  const optOut = channels.includes("sms")
    ? "Clients who reply STOP are removed automatically."
    : "Clients who unsubscribe are removed automatically.";

  return (
    // Side by side from sm up, so short landscape screens keep room for the list.
    <div
      ref={ref}
      tabIndex={-1}
      className="flex flex-col gap-2 rounded-2xl border border-ink/15 p-[clamp(0.625rem,2svh,1rem)] sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-extrabold text-[clamp(1rem,min(4.5vw,2.8svh),1.25rem)]">
          <CircleCheck aria-hidden="true" className="size-6 shrink-0 text-success" />
          {scheduled ? `Scheduled for ${formatSendTime(sendTime ?? { mode: "now" })}` : "Launched"}
        </p>
        <p className="mt-1 text-sm text-muted short:mt-0.5 short:text-xs">
          {WHO[channels.join()]} go out {when}. {optOut}
        </p>
      </div>
      <div className="flex shrink-0 justify-end">
        {scheduled ? (
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancelSchedule}
            className={SECONDARY_BUTTON}
          >
            Cancel schedule
          </button>
        ) : (
          <button type="button" onClick={onStartNew} className={SECONDARY_BUTTON}>
            Start a new campaign
          </button>
        )}
      </div>
    </div>
  );
}

type CancelScheduleDialogProps = {
  open: boolean;
  onKeep: () => void;
  onCancelSchedule: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
};

/** Lives outside LaunchStatus, so it can fade out after the status block is gone. */
export function CancelScheduleDialog({
  open,
  onKeep,
  onCancelSchedule,
  returnFocusRef,
}: CancelScheduleDialogProps) {
  const keepRef = useRef<HTMLButtonElement>(null);
  return (
    <AgentDialog
      open={open}
      onClose={onKeep}
      message="Do you want to cancel this scheduled campaign?"
      initialFocusRef={keepRef}
      returnFocusRef={returnFocusRef}
    >
      <div className="mt-4 flex justify-end gap-3">
        <button ref={keepRef} type="button" onClick={onKeep} className={SECONDARY_BUTTON}>
          Keep it
        </button>
        <button type="button" onClick={onCancelSchedule} className={PRIMARY_BUTTON}>
          Yes, cancel
        </button>
      </div>
    </AgentDialog>
  );
}
