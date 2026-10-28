import { describe, expect, it } from "vitest";
import { docToText, textToDoc, toSingleLine } from "./messageDoc";

const token = { type: "token", attrs: { id: "first_name" } };

function inline(text: string) {
  return textToDoc(text).content?.[0]?.content;
}

describe("textToDoc", () => {
  it("turns the empty string into one empty paragraph", () => {
    expect(textToDoc("")).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
  });

  it("turns tokens into token nodes", () => {
    expect(inline("Hi {{first_name}}!")).toEqual([
      { type: "text", text: "Hi " },
      token,
      { type: "text", text: "!" },
    ]);
  });

  it("handles tokens at the start and end, and next to each other", () => {
    expect(inline("{{first_name}}{{first_name}} hi {{first_name}}")).toEqual([
      token,
      token,
      { type: "text", text: " hi " },
      token,
    ]);
  });

  it("turns newlines into hard breaks, including blank lines", () => {
    expect(inline("a\n\nb")).toEqual([
      { type: "text", text: "a" },
      { type: "hardBreak" },
      { type: "hardBreak" },
      { type: "text", text: "b" },
    ]);
  });

  it("treats Windows line endings as one newline", () => {
    expect(docToText(textToDoc("a\r\nb"))).toBe("a\nb");
  });
});

describe("docToText", () => {
  it("ignores unknown tokens", () => {
    const doc = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "token", attrs: { id: "nope" } }] }],
    };
    expect(docToText(doc)).toBe("");
  });
});

describe("round trip", () => {
  it.each([
    "",
    "Hello",
    "Hi {{first_name}}, see you soon",
    "{{first_name}} first",
    "last {{first_name}}",
    "{{first_name}}{{first_name}}",
    "one {{first_name}} two {{first_name}} three",
    "Line one\nLine two\n\nLine four\n",
    "\n{{first_name}}\n",
    "Emoji 💇‍♀️ and {braces} {{not_a_token}}",
  ])("keeps %j unchanged", (text) => {
    expect(docToText(textToDoc(text))).toBe(text);
  });
});

describe("toSingleLine", () => {
  it("replaces line breaks with one space", () => {
    expect(toSingleLine("Hi\n\nthere\r\nyou")).toBe("Hi there you");
  });
});
