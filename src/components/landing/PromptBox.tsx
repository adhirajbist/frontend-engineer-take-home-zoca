import { ArrowUp } from "lucide-react";
import { useLayoutEffect, type KeyboardEvent, type RefObject } from "react";

export const PROMPT_MAX_LENGTH = 300;

type PromptBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

/** The owner's request to Steve. Enter sends, Shift+Enter adds a line. */
export function PromptBox({ value, onChange, onSend, disabled, textareaRef }: PromptBoxProps) {
  const canSend = !disabled && value.trim() !== "";

  // Grows with the text from 2 lines; max-h stops it at 5, then it scrolls.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value, textareaRef]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (canSend) onSend();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) onSend();
      }}
      className="rounded-3xl border border-ink/15 bg-white p-3 shadow-lg shadow-ink/10 has-[textarea:focus-visible]:border-purple has-[textarea:focus-visible]:ring-1 has-[textarea:focus-visible]:ring-purple"
    >
      <label htmlFor="campaign-prompt" className="sr-only">
        Describe your campaign
      </label>
      <textarea
        id="campaign-prompt"
        ref={textareaRef}
        rows={2}
        maxLength={PROMPT_MAX_LENGTH}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="How can I help you today?"
        // The container shows focus instead.
        className="focus-on-container block max-h-30 w-full resize-none overflow-y-auto bg-transparent px-2 text-base leading-6 text-ink placeholder:text-muted disabled:cursor-not-allowed"
      />
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          aria-label="Send"
          disabled={!canSend}
          className="grid size-11 place-items-center rounded-full bg-aubergine text-cream hover:bg-burgundy disabled:cursor-not-allowed disabled:bg-track disabled:text-muted"
        >
          <ArrowUp aria-hidden="true" className="size-5" />
        </button>
      </div>
    </form>
  );
}
