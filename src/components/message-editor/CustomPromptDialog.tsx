import { useRef, useState, type FormEvent, type RefObject } from "react";
import { AgentDialog } from "@/components/AgentDialog";
import { StatusMessage } from "@/components/StatusMessage";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/custom-group/buttonStyles";
import { CUSTOM_PROMPT_MAX_LENGTH, validateCustomPrompt } from "@/lib/customPrompt";

type CustomPromptDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Kept by the parent so Cancel and reopen keeps what was typed. */
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSend: (prompt: string) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
};

/** The owner describes the message they want written. */
export function CustomPromptDialog({
  open,
  onClose,
  prompt,
  onPromptChange,
  onSend,
  returnFocusRef,
}: CustomPromptDialogProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <AgentDialog
      open={open}
      onClose={onClose}
      message="Describe the message that we will send."
      initialFocusRef={textareaRef}
      returnFocusRef={returnFocusRef}
    >
      <PromptForm
        prompt={prompt}
        onPromptChange={onPromptChange}
        onSend={onSend}
        onCancel={onClose}
        textareaRef={textareaRef}
      />
    </AgentDialog>
  );
}

type PromptFormProps = {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSend: (prompt: string) => void;
  onCancel: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

/** Lives inside the dialog content, so its error resets each time the dialog opens. */
function PromptForm({ prompt, onPromptChange, onSend, onCancel, textareaRef }: PromptFormProps) {
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const check = validateCustomPrompt(prompt);
    if (check.ok) {
      onSend(check.prompt);
    } else {
      setError(check.error);
      textareaRef.current?.focus();
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="custom-prompt" className="sr-only">
        What the message should say
      </label>
      {/* text-base stops iPhones zooming in on focus. */}
      <textarea
        ref={textareaRef}
        id="custom-prompt"
        rows={3}
        value={prompt}
        onChange={(event) => {
          onPromptChange(event.target.value);
          setError(null);
        }}
        maxLength={CUSTOM_PROMPT_MAX_LENGTH}
        placeholder="e.g. 20% off balayage for regulars before Diwali"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "custom-prompt-error" : undefined}
        className="mt-4 block w-full resize-none rounded-lg border border-ink/20 bg-white px-3 py-2 text-base aria-invalid:border-error"
      />
      {/* Always in the page, so screen readers announce the error when it appears. */}
      <div role="alert">
        {error && (
          <div className="mt-2">
            <StatusMessage id="custom-prompt-error" kind="error" text={error} />
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className={SECONDARY_BUTTON}>
          Cancel
        </button>
        <button type="submit" className={PRIMARY_BUTTON}>
          Send
        </button>
      </div>
    </form>
  );
}
