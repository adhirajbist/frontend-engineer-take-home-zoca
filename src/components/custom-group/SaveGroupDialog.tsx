import { useRef, useState, type FormEvent, type RefObject } from "react";
import { AgentDialog } from "@/components/AgentDialog";
import { StatusMessage } from "@/components/StatusMessage";
import { GROUP_NAME_MAX_LENGTH, validateGroupName } from "@/lib/saveFlow";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./buttonStyles";

type SaveGroupDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Kept by the parent so Cancel and reopen keeps what was typed. */
  name: string;
  onNameChange: (name: string) => void;
  /** Gets the trimmed name. Returns an error to show, or null once saved. */
  onDone: (name: string) => string | null;
  /** Where focus goes when the dialog closes. */
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

export function SaveGroupDialog({
  open,
  onClose,
  name,
  onNameChange,
  onDone,
  returnFocusRef,
}: SaveGroupDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <AgentDialog
      open={open}
      onClose={onClose}
      message="What would you like to call this group?"
      initialFocusRef={inputRef}
      returnFocusRef={returnFocusRef}
    >
      <NameForm
        name={name}
        onNameChange={onNameChange}
        onDone={onDone}
        onCancel={onClose}
        inputRef={inputRef}
      />
    </AgentDialog>
  );
}

type NameFormProps = {
  name: string;
  onNameChange: (name: string) => void;
  onDone: (name: string) => string | null;
  onCancel: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

/** Lives inside the dialog content, so its error resets each time the dialog opens. */
function NameForm({ name, onNameChange, onDone, onCancel, inputRef }: NameFormProps) {
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const check = validateGroupName(name);
    const failure = check.ok ? onDone(check.name) : check.error;
    if (failure) {
      setError(failure);
      inputRef.current?.focus();
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="group-name" className="sr-only">
        Group name
      </label>
      {/* text-base stops iPhones zooming in on focus. */}
      <input
        ref={inputRef}
        id="group-name"
        type="text"
        value={name}
        onChange={(event) => {
          onNameChange(event.target.value);
          setError(null);
        }}
        maxLength={GROUP_NAME_MAX_LENGTH}
        placeholder="Enter a name for this group"
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "group-name-error" : undefined}
        className="mt-4 h-11 w-full rounded-lg border border-ink/20 bg-white px-3 text-base aria-invalid:border-error"
      />
      {/* Always in the page, so screen readers announce the error when it appears. */}
      <div role="alert">
        {error && (
          <div className="mt-2">
            <StatusMessage id="group-name-error" kind="error" text={error} />
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
