"use client";

import { Extension } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import { Slice } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type Ref,
} from "react";
import { docToText, textToDoc, toSingleLine } from "@/lib/messageDoc";
import type { MessageField } from "@/lib/messageLimits";
import { FieldCounter } from "./FieldCounter";
import { TokenNode } from "./TokenNode";

export type EditorFieldHandle = { focus: () => void };

type EditorFieldProps = {
  field: MessageField;
  /** Accessible name, e.g. "Email subject". */
  label: string;
  placeholder: string;
  /** False for the subject: one line, Enter does nothing. */
  multiline: boolean;
  /** The current value. Loaded into the editor only when it is created. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  errorId: string;
  /** Muted line under the count. */
  hint?: ReactNode;
  /** Sizing of a multiline field's box, e.g. "flex-1 min-h-39". One line is always 1 line tall. */
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

const EDITABLE = "flex-1 rounded-lg px-3 py-2 text-base leading-7 wrap-anywhere";
const ONE_LINE = "overflow-x-auto overflow-y-hidden whitespace-pre! [scrollbar-width:none]";

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
  onChange,
  error,
  errorId,
  hint,
  boxClassName = "",
  ref,
}: EditorFieldProps) {
  const isClient = useIsClient();
  const counterId = `${field}-count`;

  return (
    <div className={multiline ? "flex flex-1 flex-col" : ""}>
      <div
        className={`flex flex-col rounded-lg border bg-white ${
          error ? "border-error ring-1 ring-error" : "border-ink/20"
        } ${multiline ? boxClassName : "h-11.5"}`}
      >
        {isClient && (
          <TiptapEditable
            label={label}
            placeholder={placeholder}
            multiline={multiline}
            value={value}
            onChange={onChange}
            invalid={Boolean(error)}
            describedBy={error ? `${counterId} ${errorId}` : counterId}
            ref={ref}
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

type TiptapEditableProps = Pick<
  EditorFieldProps,
  "label" | "placeholder" | "multiline" | "value" | "onChange" | "ref"
> & { invalid: boolean; describedBy: string };

/** The editable area itself. The Tiptap instance owns the text while typing. */
function TiptapEditable({
  label,
  placeholder,
  multiline,
  value,
  onChange,
  invalid,
  describedBy,
  ref,
}: TiptapEditableProps) {
  const toDoc = (text: string) => textToDoc(multiline ? text : toSingleLine(text));

  // Tiptap binds its callbacks once, so they read the latest props through refs.
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
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
      content: toDoc(value),
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
        class: multiline ? EDITABLE : `${EDITABLE} ${ONE_LINE}`,
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
      if (docToText(editor.getJSON()) !== valueRef.current) {
        editor.commands.setContent(toDoc(valueRef.current), { emitUpdate: false });
      }
    },
    onUpdate: ({ editor }) => onChangeRef.current(docToText(editor.getJSON())),
  });

  useImperativeHandle(ref, () => ({ focus: () => editor?.commands.focus() }), [editor]);

  return <EditorContent editor={editor} className="flex flex-1 flex-col" />;
}
