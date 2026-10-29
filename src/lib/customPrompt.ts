export const CUSTOM_PROMPT_MAX_LENGTH = 300;

export const EMPTY_PROMPT_ERROR = "Tell me a little about the message first.";

export type PromptCheck = { ok: true; prompt: string } | { ok: false; error: string };

/** Only spaces and line breaks counts as empty. A valid prompt is kept exactly as typed. */
export function validateCustomPrompt(prompt: string): PromptCheck {
  return prompt.trim() ? { ok: true, prompt } : { ok: false, error: EMPTY_PROMPT_ERROR };
}
