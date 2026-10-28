import { isWithinLimit, remainingCharacters, type MessageField } from "./messageLimits";

export type FieldValues = Partial<Record<MessageField, string>>;

export type MessageEditorState = {
  /** The fields this editor shows, top to bottom. */
  fields: readonly MessageField[];
  values: FieldValues;
  /** Per field, the last value that was within its limit. */
  preview: FieldValues;
  /** Error text per field, set by a save attempt. */
  errors: FieldValues;
};

export type MessageEditorAction =
  | { type: "fieldChanged"; field: MessageField; value: string }
  | { type: "saveAttempted" };

const FIELD_ERRORS: Record<MessageField, { empty: string; tooLong: (over: string) => string }> = {
  sms: {
    empty: "Your text message is empty. Add a few words before saving.",
    tooLong: (over) => `Your text message is ${over} too long. Trim it to save.`,
  },
  emailSubject: {
    empty: "Your subject is empty.",
    tooLong: (over) => `Your subject is ${over} too long.`,
  },
  emailBody: {
    empty: "Your email is empty.",
    tooLong: (over) => `Your email is ${over} too long.`,
  },
};

/** Null when the field can be saved. Only spaces and line breaks counts as empty. */
export function validateField(field: MessageField, value: string): string | null {
  if (value.trim() === "") return FIELD_ERRORS[field].empty;
  const over = -remainingCharacters(field, value);
  if (over > 0) return FIELD_ERRORS[field].tooLong(over === 1 ? "1 character" : `${over} characters`);
  return null;
}

export function initMessageEditor(
  fields: readonly MessageField[],
  values: Record<MessageField, string>,
): MessageEditorState {
  const start: FieldValues = {};
  for (const field of fields) start[field] = values[field];
  return { fields, values: start, preview: { ...start }, errors: {} };
}

export function messageEditorReducer(
  state: MessageEditorState,
  action: MessageEditorAction,
): MessageEditorState {
  switch (action.type) {
    case "fieldChanged": {
      const { field, value } = action;
      const errors = { ...state.errors };
      delete errors[field];
      return {
        ...state,
        values: { ...state.values, [field]: value },
        preview: isWithinLimit(field, value) ? { ...state.preview, [field]: value } : state.preview,
        errors,
      };
    }
    case "saveAttempted": {
      const errors: FieldValues = {};
      for (const field of state.fields) {
        const error = validateField(field, state.values[field] ?? "");
        if (error) errors[field] = error;
      }
      return { ...state, errors };
    }
  }
}
