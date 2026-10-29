import { describe, expect, it } from "vitest";
import { EMPTY_PROMPT_ERROR, validateCustomPrompt } from "./customPrompt";

describe("validateCustomPrompt", () => {
  it("rejects an empty prompt", () => {
    expect(validateCustomPrompt("")).toEqual({ ok: false, error: EMPTY_PROMPT_ERROR });
  });

  it("rejects spaces and line breaks only", () => {
    expect(validateCustomPrompt("   \n  ")).toEqual({ ok: false, error: EMPTY_PROMPT_ERROR });
  });

  it("accepts a real prompt exactly as typed", () => {
    expect(validateCustomPrompt("  20% off balayage \n")).toEqual({
      ok: true,
      prompt: "  20% off balayage \n",
    });
  });
});
