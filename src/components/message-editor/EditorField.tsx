"use client";

import { Extension } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import type { Node as PmNode } from "@tiptap/pm/model";
import { Slice } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { docToText, textToDoc, toSingleLine } from "@/lib/messageDoc";
import type { MessageField } from "@/lib/messageLimits";
import type { TokenId } from "@/lib/messageTokens";
import { FieldCounter } from "./FieldCounter";
import { TokenNode } from "./TokenNode";
import { KEEPS_PLACING } from "./usePlacingMode";

export type EditorFieldHandle = {
  focus: () => void;
  hasFocus: () => boolean;
  /** Caret to the end, after undo or redo. Moves focus here only when asked. */
  placeCaretAtEnd: (focus: boolean) => void;
};

/** How a change happened, which decides whether it is an undo step right away. */
export type EditKind = "typing" | "tokenInserted" | "tokenRemoved";

type EditorFieldProps = {
  field: MessageField;
  /** Accessible name, e.g. "Email subject". */
  label: string;
  placeholder: string;
  /** False for the subject: no line breaks, Enter does nothing. Long text still wraps. */
  multiline: boolean;
  /** The current value. Loaded into the editor only when it is created. */
  value: string;
  onChange: (value: string, kind: EditKind) => void;
  /** Changes only when undo or redo replaced the value; the editor then reloads it. */
  syncRevision: number;
  /** While set, the next tap in the field adds this token there. */
  placingToken: TokenId | null;
  onTokenPlaced: () => void;
  onFocus: () => void;
  onUndo: () => void;
  onRedo: () => void;
  error?: string;
  errorId: string;
  /** Muted line under the count. */
  hint?: ReactNode;
  /** Sizing of a multiline field's box, e.g. "flex-1 min-h-39". The subject starts 1 line tall and grows as its text wraps. */
  boxClassName?: string;
  ref?: Ref<EditorFieldHandle>;
};

/** A whole message is one paragraph; line breaks are hard breaks. */
const SingleParagraph = Document.extend({ content: "paragraph" });

/** Plain text only: Enter adds a line break (or nothing), no formatting keys. */
const PlainTextKeys = Extension.create<{ multiline: boolean }>({
  name: "plainTextKeys",
  priority: 1000,
  addOptions() {
    return { multiline: true };
  },
  addKeyboardShortcuts() {
    const enter = () => (this.options.multiline ? this.editor.commands.setHardBreak() : true);
    const ignore = () => true;
    return {
      Enter: enter,
      "Shift-Enter": enter,
      "Mod-Enter": enter,
      "Mod-b": ignore,
      "Mod-i": ignore,
      "Mod-u": ignore,
    };
  },
});

/** Pastes the clipboard's plain text, turning {{first_name}} into a token. */
function pastePlainText(view: EditorView, event: ClipboardEvent, multiline: boolean) {
  const raw = event.clipboardData?.getData("text/plain") ?? "";
  const text = multiline ? raw : toSingleLine(raw);
  const paragraph = view.state.schema.nodeFromJSON(textToDoc(text)).child(0);
  view.dispatch(view.state.tr.replaceSelection(new Slice(paragraph.content, 0, 0)).scrollIntoView());
  return true;
}

/** Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z and Ctrl+Y, or null for any other key. */
function historyKey(event: KeyboardEvent): "undo" | "redo" | null {
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && key === "z") return event.shiftKey ? "redo" : "undo";
  if (event.ctrlKey && !event.shiftKey && key === "y") return "redo";
  return null;
}

/** Marks the transaction that adds a token, so it becomes its own undo step. */
const TOKEN_INSERTED = "tokenInserted";

function countTokens(doc: PmNode): number {
  let count = 0;
  doc.descendants((node) => {
    if (node.type.name === TokenNode.name) count++;
  });
  return count;
}

/** Inside the single paragraph: 1 is its start, content.size - 1 its end. */
function endOfText(editor: Editor): number {
  return editor.state.doc.content.size - 1;
}

/** The text position under a tap, or the end when the tap is below the text. */
function positionAt(editor: Editor, x: number, y: number): number {
  const { view } = editor;
  const end = endOfText(editor);
  if (y > view.coordsAtPos(end).bottom) return end;
  const pos = view.posAtCoords({ left: x, top: y })?.pos ?? end;
  return Math.min(Math.max(pos, 1), end);
}

/** Adds a token, then focuses with the caret right after it. */
function insertToken(editor: Editor, id: TokenId, at: number) {
  editor
    .chain()
    .command(({ tr }) => {
      tr.setMeta(TOKEN_INSERTED, true);
      return true;
    })
    .insertContentAt(at, { type: TokenNode.name, attrs: { id } })
    .setTextSelection(at + 1)
    .focus(undefined, { scrollIntoView: true })
    .run();
}

function toFieldDoc(text: string, multiline: boolean) {
  return textToDoc(multiline ? text : toSingleLine(text));
}

const EDITABLE = "flex-1 rounded-lg px-3 py-2 text-base leading-7 wrap-anywhere";

/** True only in the browser. Tiptap reads Math.random() while setting up, which the prerender forbids. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

function subscribeNever() {
  return () => {};
}

export function EditorField({
  field,
  label,
  placeholder,
  multiline,
  value,
  error,
  errorId,
  hint,
  boxClassName = "",
  ...editable
}: EditorFieldProps) {
  const isClient = useIsClient();
  const counterId = `${field}-count`;
  const placing = editable.placingToken !== null;

  // Placing mode: a dashed brand border and a crosshair where there is a mouse.
  const border = placing
    ? "border-dashed border-purple bg-lilac ring-1 ring-purple pointer-fine:cursor-crosshair pointer-fine:[&_.tiptap]:cursor-crosshair"
    : error
      ? "border-error bg-white ring-1 ring-error"
      : "border-ink/20 bg-white";

  return (
    <div className={multiline ? "flex flex-1 flex-col" : ""}>
      <div
        {...KEEPS_PLACING}
        className={`flex flex-col rounded-lg border ${border} ${multiline ? boxClassName : "min-h-11.5"}`}
      >
        {isClient && (
          <TiptapEditable
            {...editable}
            label={label}
            placeholder={placeholder}
            multiline={multiline}
            value={value}
            invalid={Boolean(error)}
            describedBy={error ? `${counterId} ${errorId}` : counterId}
          />
        )}
      </div>
      <div className="mt-1.5 space-y-0.5">
        <FieldCounter id={counterId} field={field} name={label} value={value} />
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
    </div>
  );
}

type TiptapEditableProps = Omit<
  EditorFieldProps,
  "field" | "error" | "errorId" | "hint" | "boxClassName"
> & { invalid: boolean; describedBy: string };

/** The editable area itself. The Tiptap instance owns the text while typing. */
function TiptapEditable({
  label,
  placeholder,
  multiline,
  value,
  onChange,
  syncRevision,
  placingToken,
  onTokenPlaced,
  onFocus,
  onUndo,
  onRedo,
  invalid,
  describedBy,
  ref,
}: TiptapEditableProps) {
  // Tiptap binds its callbacks once, so they read the latest props through refs.
  const latest = useRef({ onChange, onFocus, value });
  useEffect(() => {
    latest.current = { onChange, onFocus, value };
  });

  // Created once. Pushing values back in would move the cursor.
  const setup = useMemo(
    () => ({
      extensions: [
        SingleParagraph,
        Paragraph,
        Text,
        ...(multiline ? [HardBreak] : []),
        TokenNode,
        PlainTextKeys.configure({ multiline }),
        Placeholder.configure({ placeholder }),
      ],
      content: toFieldDoc(value, multiline),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Only rebuilt when the error state changes; Tiptap then updates the attributes.
  const editorProps = useMemo(
    () => ({
      attributes: {
        role: "textbox",
        "aria-label": label,
        "aria-multiline": String(multiline),
        "aria-placeholder": placeholder,
        "aria-invalid": String(invalid),
        "aria-describedby": describedBy,
        class: EDITABLE,
      },
      handlePaste: (view: EditorView, event: ClipboardEvent) =>
        pastePlainText(view, event, multiline),
      handleDrop: () => true,
      handleDOMEvents: {
        dragstart: (_view: EditorView, event: DragEvent) => {
          event.preventDefault();
          return true;
        },
      },
    }),
    [label, multiline, placeholder, invalid, describedBy],
  );

  const editor = useEditor({
    ...setup,
    editorProps,
    immediatelyRender: false,
    enableInputRules: false,
    enablePasteRules: false,
    // Next.js keeps a page alive while you are away, but Tiptap destroys the
    // editor while the page is hidden and creates it again from `content` when
    // you return. Load the latest value then, so the text matches the count.
    onCreate: ({ editor }) => {
      if (docToText(editor.getJSON()) !== latest.current.value) {
        editor.commands.setContent(toFieldDoc(latest.current.value, multiline), {
          emitUpdate: false,
        });
      }
    },
    onUpdate: ({ editor, transaction }) => {
      const kind: EditKind = transaction.getMeta(TOKEN_INSERTED)
        ? "tokenInserted"
        : countTokens(editor.state.doc) < countTokens(transaction.before)
          ? "tokenRemoved"
          : "typing";
      latest.current.onChange(docToText(editor.getJSON()), kind);
    },
    onFocus: () => latest.current.onFocus(),
  });

  // Undo or redo replaced the value: load it without reporting it as an edit.
  // In a microtask, because token chips are React node views that render with
  // flushSync, which React forbids inside an effect. The page places the caret
  // in a microtask queued after this one.
  const syncedRevision = useRef(syncRevision);
  useEffect(() => {
    if (!editor || syncedRevision.current === syncRevision) return;
    syncedRevision.current = syncRevision;
    queueMicrotask(() => {
      if (editor.isDestroyed || docToText(editor.getJSON()) === value) return;
      editor.commands.setContent(toFieldDoc(value, multiline), { emitUpdate: false });
    });
  }, [editor, syncRevision, value, multiline]);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => editor?.commands.focus(),
      hasFocus: () => Boolean(editor?.isFocused),
      placeCaretAtEnd: (focus) => {
        if (!editor) return;
        editor.commands.setTextSelection(endOfText(editor));
        if (focus) editor.commands.focus(undefined, { scrollIntoView: true });
      },
    }),
    [editor],
  );

  // Placing mode: the tap is taken before the editor sees it, so the caret
  // and the on-screen keyboard don't jump. Scrolling cancels the pointer.
  const tap = useRef<{ pointerId: number } | null>(null);

  function onPointerDownCapture(event: PointerEvent) {
    if (!placingToken || !editor) return;
    // Removing a token with its red cross still works.
    if ((event.target as Element).closest("button")) return;
    event.preventDefault();
    tap.current = { pointerId: event.pointerId };
  }

  function onPointerUpCapture(event: PointerEvent) {
    const started = tap.current;
    tap.current = null;
    if (!placingToken || !editor || started?.pointerId !== event.pointerId) return;
    event.preventDefault();
    insertToken(editor, placingToken, positionAt(editor, event.clientX, event.clientY));
    onTokenPlaced();
  }

  // Undo and redo go to the shared message history (Tiptap's is off). This
  // runs before ProseMirror, which then ignores the handled key.
  function onKeyDownCapture(event: KeyboardEvent) {
    const direction = historyKey(event);
    if (!direction) return;
    event.preventDefault();
    if (direction === "undo") onUndo();
    else onRedo();
  }

  return (
    <div
      className="flex flex-1 flex-col"
      onKeyDownCapture={onKeyDownCapture}
      onPointerDownCapture={onPointerDownCapture}
      onPointerUpCapture={onPointerUpCapture}
      onPointerCancelCapture={() => {
        tap.current = null;
      }}
    >
      <EditorContent editor={editor} className="flex flex-1 flex-col" />
    </div>
  );
}
