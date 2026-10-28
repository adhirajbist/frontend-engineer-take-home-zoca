import { describe, expect, it } from "vitest";
import {
  initMessageEditor,
  messageEditorReducer,
  validateField,
  type MessageEditorState,
} from "./messageEditorReducer";

const START = { sms: "Hi {{first_name}}", emailSubject: "Hello", emailBody: "Body" };

function emailEditor(): MessageEditorState {
  return initMessageEditor(["emailSubject", "emailBody"], START);
}

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
