import { describe, expect, it } from "vitest";
import { renderMessage } from "./renderMessage";

describe("renderMessage", () => {
  it("replaces every first name token", () => {
    expect(renderMessage("Hi {{first_name}}! Bye {{first_name}}.", "Priya")).toBe(
      "Hi Priya! Bye Priya.",
    );
  });

  it("leaves text without a token unchanged", () => {
    expect(renderMessage("Hello there", "Priya")).toBe("Hello there");
  });
});
