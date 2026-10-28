import { describe, expect, it } from "vitest";
import { canRedo, canUndo } from "./history";
import {
  initMessageEditor,
  messageEditorReducer,
  validateField,
  type MessageEditorAction,
  type MessageEditorState,
} from "./messageEditorReducer";

const START = { sms: "Hi {{first_name}}", emailSubject: "Hello", emailBody: "Body" };

function emailEditor(): MessageEditorState {
  return initMessageEditor(["emailSubject", "emailBody"], START);
}

function smsEditor(): MessageEditorState {
  return initMessageEditor(["sms"], START);
}

function run(state: MessageEditorState, ...actions: MessageEditorAction[]): MessageEditorState {
  return actions.reduce(messageEditorReducer, state);
}

const type = (value: string): MessageEditorAction => ({ type: "fieldChanged", field: "sms", value });

describe("initMessageEditor", () => {
  it("keeps only the editor's fields and starts the preview from them", () => {
    const state = emailEditor();
    expect(state.values).toEqual({ emailSubject: "Hello", emailBody: "Body" });
    expect(state.preview).toEqual(state.values);
    expect(state.errors).toEqual({});
  });
});

describe("fieldChanged", () => {
  it("updates the value and the preview while within the limit", () => {
    const state = messageEditorReducer(emailEditor(), {
      type: "fieldChanged",
      field: "emailSubject",
      value: "New",
    });
    expect(state.values.emailSubject).toBe("New");
    expect(state.preview.emailSubject).toBe("New");
  });

  it("keeps the last preview within the limit while over it", () => {
    const tooLong = "x".repeat(51);
    const state = messageEditorReducer(emailEditor(), {
      type: "fieldChanged",
      field: "emailSubject",
      value: tooLong,
    });
    expect(state.values.emailSubject).toBe(tooLong);
    expect(state.preview.emailSubject).toBe("Hello");
  });

  it("clears only that field's error", () => {
    const failed = messageEditorReducer(
      initMessageEditor(["emailSubject", "emailBody"], { ...START, emailSubject: "", emailBody: " " }),
      { type: "saveAttempted" },
    );
    const state = messageEditorReducer(failed, {
      type: "fieldChanged",
      field: "emailSubject",
      value: "a",
    });
    expect(state.errors).toEqual({ emailBody: "Your email is empty." });
  });
});

describe("history", () => {
  it("makes a burst of typing one undo step once the owner pauses", () => {
    const state = run(smsEditor(), type("H"), type("Hi"), type("Hi!"), { type: "typingPaused" });
    expect(state.history.entries).toEqual([{ sms: START.sms }, { sms: "Hi!" }]);
    expect(state.values.sms).toBe("Hi!");
  });

  it("commits pending typing before a token is added, then records the token", () => {
    const state = run(smsEditor(), type("Hi there"), {
      type: "tokenInserted",
      field: "sms",
      value: "Hi there {{first_name}}",
    });
    expect(state.history.entries.map((entry) => entry.sms)).toEqual([
      START.sms,
      "Hi there",
      "Hi there {{first_name}}",
    ]);
  });

  it("records a removed token as its own step", () => {
    const state = run(smsEditor(), { type: "tokenRemoved", field: "sms", value: "Hi " });
    expect(state.history.entries.map((entry) => entry.sms)).toEqual([START.sms, "Hi "]);
  });

  it("undoes pending typing, redoes it, and bumps syncRevision each time", () => {
    let state = run(smsEditor(), type("Hi there"), { type: "undo" });
    expect(state.values.sms).toBe(START.sms);
    expect(state.syncRevision).toBe(1);
    expect(state.restored).toEqual(["sms"]);
    expect(canUndo(state.history)).toBe(false);
    state = run(state, { type: "redo" });
    expect(state.values.sms).toBe("Hi there");
    expect(state.syncRevision).toBe(2);
    expect(canRedo(state.history)).toBe(false);
  });

  it("leaves syncRevision alone when there is nothing to undo, and while typing", () => {
    const state = run(smsEditor(), { type: "undo" }, type("x"), { type: "typingPaused" });
    expect(state.syncRevision).toBe(0);
  });

  it("clears redo when typing after an undo", () => {
    const state = run(smsEditor(), type("a"), { type: "undo" }, type("b"));
    expect(canRedo(state.history)).toBe(false);
  });

  it("undoes the subject and body in the order they were edited", () => {
    let state = run(
      emailEditor(),
      { type: "fieldChanged", field: "emailSubject", value: "Hello!" },
      { type: "fieldChanged", field: "emailBody", value: "Body!" },
      { type: "undo" },
    );
    expect(state.values).toEqual({ emailSubject: "Hello!", emailBody: "Body" });
    expect(state.restored).toEqual(["emailBody"]);
    state = run(state, { type: "undo" });
    expect(state.values).toEqual({ emailSubject: "Hello", emailBody: "Body" });
    expect(state.restored).toEqual(["emailSubject"]);
  });

  it("treats undo as an edit: clears the error and resumes the preview once it fits", () => {
    const tooLong = "x".repeat(51);
    let state = run(
      emailEditor(),
      { type: "fieldChanged", field: "emailSubject", value: "Fits" },
      { type: "typingPaused" },
      { type: "fieldChanged", field: "emailSubject", value: tooLong },
      { type: "saveAttempted" },
    );
    expect(state.errors.emailSubject).toBeDefined();
    expect(state.preview.emailSubject).toBe("Fits");
    state = run(state, { type: "fieldChanged", field: "emailBody", value: "Body!" });
    state = run(state, { type: "undo" }, { type: "undo" });
    expect(state.values.emailSubject).toBe("Fits");
    expect(state.errors.emailSubject).toBeUndefined();
    expect(state.preview.emailSubject).toBe("Fits");
  });

  it("commits pending typing on save", () => {
    const state = run(smsEditor(), type("Hi"), { type: "saveAttempted" });
    expect(state.history.pending).toBeNull();
    expect(state.history.entries).toHaveLength(2);
  });
});

describe("saveAttempted", () => {
  it("sets no errors when every field is valid", () => {
    expect(messageEditorReducer(emailEditor(), { type: "saveAttempted" }).errors).toEqual({});
  });

  it("checks every field of the editor", () => {
    const state = initMessageEditor(["emailSubject", "emailBody"], {
      ...START,
      emailSubject: "",
      emailBody: "x".repeat(270),
    });
    expect(messageEditorReducer(state, { type: "saveAttempted" }).errors).toEqual({
      emailSubject: "Your subject is empty.",
      emailBody: "Your email is 20 characters too long.",
    });
  });
});

describe("validateField", () => {
  it("treats spaces and line breaks as empty", () => {
    expect(validateField("sms", " \n ")).toBe(
      "Your text message is empty. Add a few words before saving.",
    );
  });

  it("does not treat a lone token as empty", () => {
    expect(validateField("sms", "{{first_name}}")).toBeNull();
  });

  it("counts tokens as 15 characters", () => {
    // 121 + 15 = 136, one over the 135 limit.
    expect(validateField("sms", "x".repeat(121) + "{{first_name}}")).toBe(
      "Your text message is 1 character too long. Trim it to save.",
    );
  });

  it("allows exactly the limit", () => {
    expect(validateField("emailSubject", "x".repeat(50))).toBeNull();
  });
});
