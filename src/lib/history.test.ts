import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  canRedo,
  canUndo,
  commitPending,
  createHistory,
  createTypingTimer,
  currentSnapshot,
  HISTORY_DEBOUNCE_MS,
  record,
  redo,
  setPending,
  undo,
} from "./history";

describe("history", () => {
  it("starts at the initial text, which is the floor", () => {
    const history = createHistory("Hi");
    expect(currentSnapshot(history)).toBe("Hi");
    expect(canUndo(history)).toBe(false);
    expect(canRedo(history)).toBe(false);
    expect(currentSnapshot(undo(history))).toBe("Hi");
  });

  it("undoes, then redoes back to the latest state", () => {
    let history = record(record(createHistory("a"), "ab"), "abc");
    history = undo(undo(history));
    expect(currentSnapshot(history)).toBe("a");
    expect(canUndo(history)).toBe(false);
    history = redo(redo(history));
    expect(currentSnapshot(history)).toBe("abc");
    expect(canRedo(history)).toBe(false);
  });

  it("clears redo as soon as new typing starts after an undo", () => {
    let history = commitPending(setPending(createHistory("a"), "a typed"));
    history = undo(history);
    expect(canRedo(history)).toBe(true);
    history = setPending(history, "a new");
    expect(canRedo(history)).toBe(false);
    expect(currentSnapshot(history)).toBe("a new");
  });

  it("does not add a snapshot identical to the current one", () => {
    let history = record(createHistory("a"), "a");
    expect(history.entries).toEqual(["a"]);
    history = commitPending(setPending(history, "a"));
    expect(history.entries).toEqual(["a"]);
    expect(canUndo(setPending(history, "a"))).toBe(false);
  });

  it("commits pending typing before undo, so the typing can be redone", () => {
    let history = setPending(createHistory("a"), "a typed");
    expect(canUndo(history)).toBe(true);
    history = undo(history);
    expect(currentSnapshot(history)).toBe("a");
    expect(currentSnapshot(redo(history))).toBe("a typed");
  });

  it("commits pending typing before an immediate step", () => {
    const history = record(setPending(createHistory("a"), "a typed"), "a typed {{first_name}}");
    expect(history.entries).toEqual(["a", "a typed", "a typed {{first_name}}"]);
  });

  it("undoes across both email fields in the order of the edits", () => {
    let history = createHistory({ subject: "S", body: "B" });
    history = commitPending(setPending(history, { subject: "S2", body: "B" }));
    history = commitPending(setPending(history, { subject: "S2", body: "B2" }));
    history = undo(history);
    expect(currentSnapshot(history)).toEqual({ subject: "S2", body: "B" });
    history = undo(history);
    expect(currentSnapshot(history)).toEqual({ subject: "S", body: "B" });
    expect(canUndo(history)).toBe(false);
  });

  it("treats two-field snapshots with the same text as identical", () => {
    const history = record(createHistory({ subject: "S", body: "B" }), { subject: "S", body: "B" });
    expect(history.entries).toHaveLength(1);
  });
});

describe("createTypingTimer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires once after a burst of typing pauses", () => {
    const onPause = vi.fn();
    const timer = createTypingTimer(onPause);
    for (let i = 0; i < 10; i++) {
      timer.restart();
      vi.advanceTimersByTime(100);
    }
    expect(onPause).not.toHaveBeenCalled();
    vi.advanceTimersByTime(HISTORY_DEBOUNCE_MS);
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it("does not fire after being cancelled by a flush", () => {
    const onPause = vi.fn();
    const timer = createTypingTimer(onPause);
    timer.restart();
    timer.cancel();
    vi.advanceTimersByTime(HISTORY_DEBOUNCE_MS * 2);
    expect(onPause).not.toHaveBeenCalled();
  });
});
