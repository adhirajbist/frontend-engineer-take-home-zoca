import type { JSONContent } from "@tiptap/core";
import { MESSAGE_TOKENS, findToken } from "./messageTokens";

/**
 * Messages are stored as plain strings, with tokens written as {{first_name}}.
 * The editor works on a document of exactly one paragraph holding text, hard
 * breaks (one per "\n") and token nodes.
 *
 * Literal text "{{first_name}}" typed by the owner stays text while editing,
 * but becomes a token after a reload. That is acceptable: it means the same.
 */

/** Splits on any token, keeping the tokens: "Hi {{first_name}}!" -> ["Hi ", "{{first_name}}", "!"]. */
const TOKEN_PATTERN = new RegExp(
  `(${MESSAGE_TOKENS.map((token) => escapeRegExp(token.text)).join("|")})`,
);

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** For one-line fields: every run of line breaks becomes a single space. */
export function toSingleLine(text: string): string {
  return text.replace(/[\r\n]+/g, " ");
}

export function textToDoc(text: string): JSONContent {
  const content: JSONContent[] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");

  lines.forEach((line, index) => {
    if (index > 0) content.push({ type: "hardBreak" });
    for (const part of line.split(TOKEN_PATTERN)) {
      if (part === "") continue;
      const token = MESSAGE_TOKENS.find((t) => t.text === part);
      content.push(
        token ? { type: "token", attrs: { id: token.id } } : { type: "text", text: part },
      );
    }
  });

  const paragraph: JSONContent = { type: "paragraph" };
  if (content.length > 0) paragraph.content = content;
  return { type: "doc", content: [paragraph] };
}

function nodeToText(node: JSONContent): string {
  switch (node.type) {
    case "text":
      return node.text ?? "";
    case "hardBreak":
      return "\n";
    case "token": {
      const id: unknown = node.attrs?.id;
      return typeof id === "string" ? (findToken(id)?.text ?? "") : "";
    }
    default:
      return (node.content ?? []).map(nodeToText).join("");
  }
}

export function docToText(doc: JSONContent): string {
  return nodeToText(doc);
}
