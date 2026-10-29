import { useRef, useState, type FormEvent, type RefObject } from "react";
import { AgentDialog } from "@/components/AgentDialog";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/custom-group/buttonStyles";
import { StatusMessage } from "@/components/StatusMessage";
import {
  getDefaultScheduleWallClock,
  getMinScheduleWallClock,
  isoToSalonWallClock,
  MIN_LEAD_MINUTES,
  salonTimeZoneName,
  validateSchedule,
  type ScheduleCheck,
} from "@/lib/time";

type SchedulePickerDialogProps = {
  open: boolean;
  onClose: () => void;
  /** The current scheduled time, if any. Prefills the picker. */
  scheduledIso: string | null;
  /** Gets a valid ISO instant. */
  onDone: (iso: string) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
};

type ScheduleError = Exclude<ScheduleCheck, { ok: true }>["reason"];

const ERRORS: Record<ScheduleError, string> = {
  empty: "Pick a date and time.",
  invalid: "That time doesn’t exist. Pick another one.",
  "too-soon": `That time is too soon. Pick a time at least ${MIN_LEAD_MINUTES} minutes from now.`,
};

export function SchedulePickerDialog({
  open,
  onClose,
  scheduledIso,
  onDone,
  returnFocusRef,
}: SchedulePickerDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <AgentDialog
      open={open}
      onClose={onClose}
      message="When should we send it?"
      initialFocusRef={inputRef}
      returnFocusRef={returnFocusRef}
    >
      <ScheduleForm
        scheduledIso={scheduledIso}
        onDone={onDone}
        onCancel={onClose}
        inputRef={inputRef}
      />
    </AgentDialog>
  );
}

type ScheduleFormProps = {
  scheduledIso: string | null;
  onDone: (iso: string) => void;
  onCancel: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

/** Lives inside the dialog content, so it starts fresh each time the dialog opens. */
function ScheduleForm({ scheduledIso, onDone, onCancel, inputRef }: ScheduleFormProps) {
  // Read once when the dialog opens. Done checks against the time it is pressed.
  const [openedAt] = useState(() => new Date());
  const [value, setValue] = useState(() =>
    scheduledIso ? isoToSalonWallClock(scheduledIso) : getDefaultScheduleWallClock(openedAt),
  );
  const [error, setError] = useState<ScheduleError | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const check = validateSchedule(value, new Date());
    if (check.ok) {
      onDone(check.iso);
      return;
    }
    setError(check.reason);
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="send-time" className="sr-only">
        Date and time
      </label>
      {/* text-base stops iPhones zooming in on focus. */}
      <input
        ref={inputRef}
        id="send-time"
        type="datetime-local"
        value={value}
        min={getMinScheduleWallClock(openedAt)}
        onChange={(event) => {
          setValue(event.target.value);
          setError(null);
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "send-time-zone send-time-error" : "send-time-zone"}
        className="mt-4 block min-h-12 w-full appearance-none rounded-lg border-2 border-ink/20 bg-white px-3 py-2 text-left text-base text-ink tabular-nums aria-invalid:border-error"
      />
      <p id="send-time-zone" className="mt-1 text-sm text-muted">
        {salonTimeZoneName()}
      </p>
      {/* Always in the page, so screen readers announce the error when it appears. */}
      <div role="alert">
        {error && (
          <div className="mt-2">
            <StatusMessage id="send-time-error" kind="error" text={ERRORS[error]} />
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className={SECONDARY_BUTTON}>
          Cancel
        </button>
        <button type="submit" className={PRIMARY_BUTTON}>
          Done
        </button>
      </div>
    </form>
  );
}
