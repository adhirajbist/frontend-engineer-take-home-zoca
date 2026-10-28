"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducer, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { CAMPAIGN_CHANNELS } from "@/components/cards/content/dummyContent";
import { PRIMARY_BUTTON } from "@/components/custom-group/buttonStyles";
import { DUMMY_MESSAGES } from "@/data/dummyMessages";
import { CONTENT_CARD } from "@/lib/editorRoutes";
import {
  initMessageEditor,
  messageEditorReducer,
  validateField,
  type FieldValues,
} from "@/lib/messageEditorReducer";
import { isWithinLimit, OPT_OUT_LINE, type MessageField } from "@/lib/messageLimits";
import type { Channel, EmailMessage, SmsMessage } from "@/types";
import { EditorField, type EditorFieldHandle } from "./EditorField";
import { EditorFooter } from "./EditorFooter";
import { PreviewPanel } from "./PreviewPanel";

type FieldSetup = {
  field: MessageField;
  label: string;
  placeholder: string;
  multiline: boolean;
  hint?: string;
};

const EDITORS: Record<
  Channel,
  { title: string; previewLabel: string; noun: string; fields: FieldSetup[] }
> = {
  sms: {
    title: "Edit your text message",
    previewLabel: "Preview of your text message",
    noun: "a text message",
    fields: [
      {
        field: "sms",
        label: "Text message",
        placeholder: "Write your text message here",
        multiline: true,
        hint: `We’ll add “${OPT_OUT_LINE}” at the end.`,
      },
    ],
  },
  email: {
    title: "Edit your email",
    previewLabel: "Preview of your email",
    noun: "an email",
    fields: [
      { field: "emailSubject", label: "Email subject", placeholder: "Subject line", multiline: false },
      {
        field: "emailBody",
        label: "Email body",
        placeholder: "Write your email here",
        multiline: true,
        hint: "We’ll add an unsubscribe link at the bottom.",
      },
    ],
  },
};

type Tab = "edit" | "preview";

const TAB_OPTIONS = [
  { value: "edit", label: "Edit" },
  { value: "preview", label: "Preview" },
] as const;

function toMessage(channel: Channel, values: FieldValues): SmsMessage | EmailMessage {
  const trimmed = (field: MessageField) => (values[field] ?? "").trim();
  return channel === "sms"
    ? { text: trimmed("sms") }
    : { subject: trimmed("emailSubject"), body: trimmed("emailBody") };
}

function saveMessage(channel: Channel, message: SmsMessage | EmailMessage) {
  // TODO: save the message to the store so the Content card shows it.
  void channel;
  void message;
}

/** Edits one channel's message. Shows a way back if the campaign doesn't use it. */
export function MessageEditorPage({ channel }: { channel: Channel }) {
  // Changes on every new visit (e.g. "Edit message"), but not on browser
  // back/forward. Keying on it makes each visit start from the saved message.
  const { bfcacheId } = useRouter();

  return (
    // The document never scrolls (see globals.css), so this page scrolls itself.
    <main className="focus-burgundy h-(--screen) overflow-y-auto">
      <div className="mx-auto max-w-300 px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
        <Link
          href={CONTENT_CARD}
          scroll={false}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-burgundy hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
          Back to campaign
        </Link>
        {CAMPAIGN_CHANNELS.includes(channel) ? (
          <MessageEditor key={bfcacheId} channel={channel} />
        ) : (
          <NotInCampaign noun={EDITORS[channel].noun} />
        )}
      </div>
    </main>
  );
}

function NotInCampaign({ noun }: { noun: string }) {
  return (
    <>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Nothing to edit here</h1>
      <p className="mt-2">This campaign isn’t sending {noun}, so there’s no message to edit.</p>
      <Link
        href={CONTENT_CARD}
        scroll={false}
        className={`${PRIMARY_BUTTON} mt-4 inline-flex items-center`}
      >
        Back to campaign
      </Link>
    </>
  );
}

function MessageEditor({ channel }: { channel: Channel }) {
  const router = useRouter();
  const setup = EDITORS[channel];
  const [state, dispatch] = useReducer(
    messageEditorReducer,
    setup.fields.map((f) => f.field),
    // TODO: start from the campaign store once saving is wired up.
    (fields) => initMessageEditor(fields, DUMMY_MESSAGES),
  );
  // Phones and tablets only; from lg up both sections show side by side.
  const [tab, setTab] = useState<Tab>("edit");
  const fieldRefs = useRef<Partial<Record<MessageField, EditorFieldHandle | null>>>({});

  const value = (field: MessageField) => state.values[field] ?? "";
  const paused = state.fields.some((field) => !isWithinLimit(field, value(field)));
  const errorId = (field: MessageField) => `${field}-error`;

  function handleSave() {
    const failing = state.fields.filter((field) => validateField(field, value(field)));
    dispatch({ type: "saveAttempted" });
    if (failing.length > 0) {
      // The editor must be showing before it can take focus.
      flushSync(() => setTab("edit"));
      fieldRefs.current[failing[0]]?.focus();
      return;
    }
    saveMessage(channel, toMessage(channel, state.values));
    router.push(CONTENT_CARD, { scroll: false });
  }

  const errors = state.fields.flatMap((field) => {
    const text = state.errors[field];
    return text ? [{ id: errorId(field), text }] : [];
  });

  return (
    <>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{setup.title}</h1>
      <Tabs.Root value={tab} onValueChange={(next) => setTab(next as Tab)}>
        <SegmentedTabs label="Edit or preview" options={TAB_OPTIONS} className="mt-4 w-fit lg:hidden" />
        <div className="mt-4 grid gap-6 lg:mt-6 lg:grid-cols-2 lg:gap-8">
          {/* Both sections stay mounted, so the editor keeps its text and
              cursor while the Preview tab is open. */}
          <Panel value="edit" tabIndex={-1} className="flex flex-col">
            <div className="flex flex-1 flex-col gap-4">
              {setup.fields.map((f) => (
                <EditorField
                  key={f.field}
                  ref={(handle) => {
                    fieldRefs.current[f.field] = handle;
                  }}
                  {...f}
                  value={value(f.field)}
                  onChange={(next) => dispatch({ type: "fieldChanged", field: f.field, value: next })}
                  error={state.errors[f.field]}
                  errorId={errorId(f.field)}
                  boxClassName="flex-1 min-h-39"
                />
              ))}
            </div>
            <EditorFooter errors={errors} onSave={handleSave} />
          </Panel>
          <Panel value="preview" aria-label={setup.previewLabel}>
            <PreviewPanel channel={channel} preview={state.preview} paused={paused} />
          </Panel>
        </div>
      </Tabs.Root>
    </>
  );
}

type PanelProps = {
  value: Tab;
  className?: string;
  tabIndex?: number;
  "aria-label"?: string;
  children: ReactNode;
};

/** A tab panel below lg that is hidden with CSS, never unmounted. Always shown from lg up. */
function Panel({ value, className = "", children, ...rest }: PanelProps) {
  return (
    <Tabs.Content
      value={value}
      forceMount
      // An aria-label, when given, names the panel instead of its tab.
      {...(rest["aria-label"] && { "aria-labelledby": undefined })}
      {...rest}
      className={`min-w-0 max-lg:data-[state=inactive]:hidden ${className}`}
    >
      {children}
    </Tabs.Content>
  );
}
