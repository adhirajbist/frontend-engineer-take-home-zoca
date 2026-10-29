import {
  commitPending,
  createHistory,
  currentSnapshot,
  record,
  redo,
  setPending,
  undo,
  type History,
} from "./history";
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
  /** One shared undo history for the whole message. */
  history: History<FieldValues>;
  /** The field being typed in, while that typing is not an undo step yet. */
  typingField: MessageField | null;
  /** Goes up only when undo, redo or an AI rewrite replaces the text, so the editors reload it. */
  syncRevision: number;
  /** The fields the last undo, redo or AI rewrite changed. */
  restored: readonly MessageField[];
};

export type MessageEditorAction =
  /** Typing: an undo step only after a pause (typingPaused). */
  | { type: "fieldChanged"; field: MessageField; value: string }
  | { type: "typingPaused" }
  /** Each its own undo step right away. */
  | { type: "tokenInserted"; field: MessageField; value: string }
  | { type: "tokenRemoved"; field: MessageField; value: string }
  /** An AI rewrite of one or more fields: one undo step, loaded into the editors. */
  | { type: "aiApplied"; values: FieldValues }
  | { type: "undo" }
  | { type: "redo" }
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

/**
 * True when the message differs from what the page opened with. Spaces and
 * line breaks at the ends don't count, because Save trims them anyway.
 */
export function isDirty(state: MessageEditorState): boolean {
  const initial = state.history.entries[0];
  return state.fields.some(
    (field) => (state.values[field] ?? "").trim() !== (initial[field] ?? "").trim(),
  );
}

export function initMessageEditor(
  fields: readonly MessageField[],
  values: Record<MessageField, string>,
): MessageEditorState {
  const start: FieldValues = {};
  for (const field of fields) start[field] = values[field];
  return {
    fields,
    values: start,
    preview: { ...start },
    errors: {},
    history: createHistory(start),
    typingField: null,
    syncRevision: 0,
    restored: [],
  };
}

/** Any edit: the new value shows at once, clears its error and updates the preview if it fits. */
function applyValue(state: MessageEditorState, field: MessageField, value: string): MessageEditorState {
  const errors = { ...state.errors };
  delete errors[field];
  return {
    ...state,
    values: { ...state.values, [field]: value },
    preview: isWithinLimit(field, value) ? { ...state.preview, [field]: value } : state.preview,
    errors,
  };
}

function flushTyping(state: MessageEditorState): MessageEditorState {
  return { ...state, history: commitPending(state.history), typingField: null };
}

/** Shows the snapshot undo or redo landed on and tells the editors to reload. */
function restore(state: MessageEditorState, history: History<FieldValues>): MessageEditorState {
  const snapshot = currentSnapshot(history);
  const restored = state.fields.filter((field) => snapshot[field] !== state.values[field]);
  if (restored.length === 0) return { ...state, history, typingField: null };
  let next = state;
  for (const field of restored) next = applyValue(next, field, snapshot[field] ?? "");
  return { ...next, history, typingField: null, syncRevision: state.syncRevision + 1, restored };
}

export function messageEditorReducer(
  state: MessageEditorState,
  action: MessageEditorAction,
): MessageEditorState {
  switch (action.type) {
    case "fieldChanged": {
      // Moving to another field ends the typing in the last one, so email
      // undo steps follow the order the fields were edited in.
      const before = state.typingField === action.field ? state : flushTyping(state);
      const next = applyValue(before, action.field, action.value);
      return { ...next, history: setPending(next.history, next.values), typingField: action.field };
    }
    case "typingPaused":
      return flushTyping(state);
    case "tokenInserted":
    case "tokenRemoved": {
      const next = applyValue(state, action.field, action.value);
      return { ...next, history: record(next.history, next.values), typingField: null };
    }
    case "aiApplied": {
      const flushed = flushTyping(state);
      const changed = state.fields.filter(
        (field) => action.values[field] !== undefined && action.values[field] !== state.values[field],
      );
      // The same text as now: nothing to undo, nothing to reload.
      if (changed.length === 0) return flushed;
      let next = flushed;
      for (const field of changed) next = applyValue(next, field, action.values[field] ?? "");
      return {
        ...next,
        history: record(next.history, next.values),
        syncRevision: state.syncRevision + 1,
        restored: changed,
      };
    }
    case "undo":
      return restore(state, undo(state.history));
    case "redo":
      return restore(state, redo(state.history));
    case "saveAttempted": {
      const errors: FieldValues = {};
      for (const field of state.fields) {
        const error = validateField(field, state.values[field] ?? "");
        if (error) errors[field] = error;
      }
      return { ...flushTyping(state), errors };
    }
  }
}
