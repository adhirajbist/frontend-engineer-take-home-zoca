import * as Dialog from "@radix-ui/react-dialog";
import { useRef, useState, type FormEvent, type RefObject } from "react";
import { AgentBubble } from "@/components/AgentBubble";
import { StatusMessage } from "@/components/StatusMessage";
import { GROUP_NAME_MAX_LENGTH, validateGroupName } from "@/lib/saveFlow";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./buttonStyles";

type SaveGroupDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Kept by the parent so Cancel and reopen keeps what was typed. */
  name: string;
  onNameChange: (name: string) => void;
  onDone: (name: string) => void;
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
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        {/* Phones and short screens: near the top, so the on-screen keyboard
            never covers it. Roomy screens: centred. */}
        <Dialog.Overlay className="fixed inset-0 z-20 flex items-start justify-center bg-ink/50 px-4 pt-[max(1rem,6svh)] motion-safe:data-[state=closed]:animate-overlay-out motion-safe:data-[state=open]:animate-overlay-in [@media(min-width:40rem)_and_(min-height:30rem)]:items-center [@media(min-width:40rem)_and_(min-height:30rem)]:pt-0">
          <Dialog.Content
            aria-describedby={undefined}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              inputRef.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              returnFocusRef.current?.focus();
            }}
            className="focus-burgundy max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-cream p-4 text-ink shadow-xl shadow-ink/20 motion-safe:data-[state=closed]:animate-dialog-out motion-safe:data-[state=open]:animate-dialog-in sm:p-5"
          >
            <NameForm
              name={name}
              onNameChange={onNameChange}
              onDone={onDone}
              onCancel={onClose}
              inputRef={inputRef}
            />
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type NameFormProps = {
  name: string;
  onNameChange: (name: string) => void;
  onDone: (name: string) => void;
  onCancel: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

/** Lives inside the dialog content, so its error resets each time the dialog opens. */
function NameForm({ name, onNameChange, onDone, onCancel, inputRef }: NameFormProps) {
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const check = validateGroupName(name);
    if (check.ok) {
      onDone(check.name);
    } else {
      setError(check.error);
      inputRef.current?.focus();
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <AgentBubble>
        <Dialog.Title asChild>
          <p>What would you like to call this group?</p>
        </Dialog.Title>
      </AgentBubble>
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
