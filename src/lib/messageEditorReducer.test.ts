import { describe, expect, it } from "vitest";
import { canRedo, canUndo } from "./history";
import {
  initMessageEditor,
  isDirty,
  messageEditorReducer,
  validateField,
  type FieldValues,
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

describe("aiApplied", () => {
  const ai = (values: FieldValues): MessageEditorAction => ({ type: "aiApplied", values });
  const smsValues = (state: MessageEditorState) => state.history.entries.map((entry) => entry.sms);

  it("makes pending typing its own step, then the rewrite another", () => {
    let state = run(smsEditor(), type("Hi there, come in"), ai({ sms: "Short" }));
    expect(smsValues(state)).toEqual([START.sms, "Hi there, come in", "Short"]);
    expect(state.values.sms).toBe("Short");
    expect(state.syncRevision).toBe(1);
    expect(state.restored).toEqual(["sms"]);
    expect(isDirty(state)).toBe(true);

    const seen: (string | undefined)[] = [];
    for (const step of ["undo", "undo", "redo", "redo"] as const) {
      state = run(state, { type: step });
      seen.push(state.values.sms);
    }
    expect(seen).toEqual(["Hi there, come in", START.sms, "Hi there, come in", "Short"]);
  });

  it("is clean again after undoing back to the start", () => {
    const state = run(smsEditor(), ai({ sms: "Short" }), { type: "undo" });
    expect(isDirty(state)).toBe(false);
  });

  it("clears redo when editing after an undo", () => {
    let state = run(smsEditor(), ai({ sms: "Short" }), { type: "undo" });
    expect(canRedo(state.history)).toBe(true);
    state = run(state, type("New"));
    expect(canRedo(state.history)).toBe(false);
    state = run(smsEditor(), ai({ sms: "Short" }), { type: "undo" }, ai({ sms: "Warm" }));
    expect(canRedo(state.history)).toBe(false);
    expect(smsValues(state)).toEqual([START.sms, "Warm"]);
  });

  it("changes the subject and body in one step that one undo restores", () => {
    let state = run(emailEditor(), ai({ emailSubject: "New subject", emailBody: "New body" }));
    expect(state.values).toEqual({ emailSubject: "New subject", emailBody: "New body" });
    expect(state.history.entries).toHaveLength(2);
    expect(state.restored).toEqual(["emailSubject", "emailBody"]);
    state = run(state, { type: "undo" });
    expect(state.values).toEqual({ emailSubject: "Hello", emailBody: "Body" });
  });

  it("adds no step when the rewrite is the same as now", () => {
    const once = run(smsEditor(), ai({ sms: "Short" }));
    const twice = run(once, ai({ sms: "Short" }));
    expect(twice.history.entries).toHaveLength(2);
    expect(twice.syncRevision).toBe(once.syncRevision);
    expect(run(smsEditor(), ai({ sms: START.sms })).history.entries).toHaveLength(1);
  });

  it("keeps the other email field when only the body is given", () => {
    const state = run(emailEditor(), ai({ emailBody: "Only the body" }));
    expect(state.values).toEqual({ emailSubject: "Hello", emailBody: "Only the body" });
    expect(state.restored).toEqual(["emailBody"]);
  });

  it("stores a custom prompt exactly as typed, even over the limit", () => {
    const prompt = `  Hi {{first_name}},\n${"x".repeat(300)} `;
    const state = run(smsEditor(), ai({ sms: prompt }));
    expect(state.values.sms).toBe(prompt);
    expect(state.preview.sms).toBe(START.sms);
  });

  it("clears the changed field's error only", () => {
    const failed = run(
      initMessageEditor(["emailSubject", "emailBody"], { ...START, emailSubject: "", emailBody: "" }),
      { type: "saveAttempted" },
    );
    const state = run(failed, ai({ emailBody: "Body!" }));
    expect(state.errors).toEqual({ emailSubject: "Your subject is empty." });
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

describe("isDirty", () => {
  it("is clean when the page opens", () => {
    expect(isDirty(smsEditor())).toBe(false);
  });

  it("is dirty after a change", () => {
    expect(isDirty(run(smsEditor(), type("Hi there")))).toBe(true);
  });

  it("is clean again after undoing back to the start", () => {
    const state = run(smsEditor(), type("Hi there"), { type: "typingPaused" }, { type: "undo" });
    expect(isDirty(state)).toBe(false);
  });

  it("ignores spaces and line breaks added at the ends", () => {
    expect(isDirty(run(smsEditor(), type("  Hi {{first_name}} \n")))).toBe(false);
  });

  it("counts a change in any email field", () => {
    const state = messageEditorReducer(emailEditor(), {
      type: "fieldChanged",
      field: "emailBody",
      value: "New body",
    });
    expect(isDirty(state)).toBe(true);
  });
});
