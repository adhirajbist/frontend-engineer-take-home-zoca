/** Placeholder the owner writes; replaced with each client's first name on send. */
export const FIRST_NAME_TOKEN = "{{first_name}}";

/** The message as one client will see it, with their first name filled in. */
export function renderMessage(text: string, firstName: string): string {
  return text.replaceAll(FIRST_NAME_TOKEN, firstName);
}
