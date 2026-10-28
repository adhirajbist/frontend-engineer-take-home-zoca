import { Node, type Editor } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { X } from "lucide-react";
import { findToken, MESSAGE_TOKENS } from "@/lib/messageTokens";

/** A token chip as the owner sees it: "First name", with a cross to remove it. */
function TokenChip({ node, editor, getPos }: ReactNodeViewProps) {
  const id: unknown = node.attrs.id;
  const label = (typeof id === "string" && findToken(id)?.label) || "Token";

  function remove() {
    const pos = getPos();
    if (typeof pos !== "number") return;
    editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + node.nodeSize })
      .setTextSelection(pos)
      .run();
  }

  return (
    <NodeViewWrapper
      as="span"
      className="relative mx-0.5 mr-2 inline-flex items-center rounded-full border border-purple/40 bg-purple/12 px-2 align-baseline text-sm leading-6 font-semibold text-burgundy"
    >
      {label}
      <span className="sr-only"> token</span>
      {/* Small to look at, but the ::after makes the tap area 24x24.
          Keyboard users remove tokens with Backspace or Delete instead. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Remove ${label.toLowerCase()}`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={remove}
        className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-error text-white after:absolute after:-inset-1 hover:bg-burgundy"
      >
        <X aria-hidden="true" strokeWidth={3} className="size-3" />
      </button>
    </NodeViewWrapper>
  );
}

/** Deletes a token right before (or after) an empty cursor in one keypress. */
function deleteTokenNextToCursor(editor: Editor, direction: "before" | "after"): boolean {
  const { selection } = editor.state;
  if (!selection.empty) return false;
  const node = direction === "before" ? selection.$from.nodeBefore : selection.$from.nodeAfter;
  if (node?.type.name !== TokenNode.name) return false;
  const from = direction === "before" ? selection.from - node.nodeSize : selection.from;
  return editor.commands.deleteRange({ from, to: from + node.nodeSize });
}

/**
 * An inline, non-editable placeholder such as {{first_name}}. Which tokens
 * exist comes from MESSAGE_TOKENS.
 */
export const TokenNode = Node.create({
  name: "token",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return { id: { default: MESSAGE_TOKENS[0].id } };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-token]",
        getAttrs: (element) => ({ id: element.getAttribute("data-token") }),
      },
    ];
  },

  renderHTML({ node }) {
    return ["span", { "data-token": node.attrs.id }];
  },

  /** Copying a token gives "{{first_name}}". */
  renderText({ node }) {
    return findToken(String(node.attrs.id))?.text ?? "";
  },

  addNodeView() {
    return ReactNodeViewRenderer(TokenChip, { as: "span" });
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => deleteTokenNextToCursor(editor, "before"),
      Delete: ({ editor }) => deleteTokenNextToCursor(editor, "after"),
    };
  },
});
