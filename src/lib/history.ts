/**
 * Undo and redo as a list of snapshots plus a pointer. Typing changes a
 * pending snapshot that is committed once the owner pauses, so a burst of
 * typing is one undo step. Other edits are recorded right away.
 */

/** How long the owner must pause typing before it becomes an undo step. */
export const HISTORY_DEBOUNCE_MS = 800;

export type History<T> = {
  /** Committed snapshots, oldest first. The first is the floor. */
  entries: readonly T[];
  /** The committed snapshot currently shown. */
  index: number;
  /** The live snapshot while typing, not committed yet. */
  pending: T | null;
};

/** Same text, or the same text in every field. */
function isSame<T>(a: T, b: T): boolean {
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return a === b;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every(
    (key) => (a as Record<string, unknown>)[key] === (b as Record<string, unknown>)[key],
  );
}

export function createHistory<T>(initial: T): History<T> {
  return { entries: [initial], index: 0, pending: null };
}

/** What the owner sees now: the pending typing, or the current entry. */
export function currentSnapshot<T>(history: History<T>): T {
  return history.pending ?? history.entries[history.index];
}

/** Typing: keeps the live snapshot without committing it. Clears redo. */
export function setPending<T>(history: History<T>, snapshot: T): History<T> {
  return {
    entries: history.entries.slice(0, history.index + 1),
    index: history.index,
    pending: snapshot,
  };
}

/** Turns pending typing into an undo step, unless nothing really changed. */
export function commitPending<T>(history: History<T>): History<T> {
  const { pending } = history;
  if (pending === null) return history;
  if (isSame(pending, history.entries[history.index])) return { ...history, pending: null };
  const entries = [...history.entries.slice(0, history.index + 1), pending];
  return { entries, index: entries.length - 1, pending: null };
}

/** An edit that is its own undo step right away, e.g. adding a token. */
export function record<T>(history: History<T>, snapshot: T): History<T> {
  const committed = commitPending(history);
  if (isSame(snapshot, committed.entries[committed.index])) return committed;
  const entries = [...committed.entries.slice(0, committed.index + 1), snapshot];
  return { entries, index: entries.length - 1, pending: null };
}

export function canUndo<T>(history: History<T>): boolean {
  return history.index > 0 || commitPending(history).index > history.index;
}

export function canRedo<T>(history: History<T>): boolean {
  const committed = commitPending(history);
  return committed.index < committed.entries.length - 1;
}

/** Commits pending typing first, so it can be redone. Stops at the floor. */
export function undo<T>(history: History<T>): History<T> {
  const committed = commitPending(history);
  if (committed.index === 0) return committed;
  return { ...committed, index: committed.index - 1 };
}

export function redo<T>(history: History<T>): History<T> {
  const committed = commitPending(history);
  if (committed.index >= committed.entries.length - 1) return committed;
  return { ...committed, index: committed.index + 1 };
}

export type TypingTimer = {
  /** Call on every keystroke: onPause runs once the owner stops for a while. */
  restart: () => void;
  /** Drops a waiting onPause, e.g. when the pending typing is flushed another way. */
  cancel: () => void;
};

export function createTypingTimer(onPause: () => void, delay = HISTORY_DEBOUNCE_MS): TypingTimer {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  return {
    restart: () => {
      cancel();
      timer = setTimeout(() => {
        timer = undefined;
        onPause();
      }, delay);
    },
    cancel,
  };
}
