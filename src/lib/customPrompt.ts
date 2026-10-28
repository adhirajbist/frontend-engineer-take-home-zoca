export const CUSTOM_PROMPT_MAX_LENGTH = 300;

export const EMPTY_PROMPT_ERROR = "Tell me a little about the message first.";

export type PromptCheck = { ok: true; prompt: string } | { ok: false; error: string };

/** Only spaces and line breaks counts as empty. */
export function validateCustomPrompt(prompt: string): PromptCheck {
  const trimmed = prompt.trim();
  return trimmed ? { ok: true, prompt: trimmed } : { ok: false, error: EMPTY_PROMPT_ERROR };
}
