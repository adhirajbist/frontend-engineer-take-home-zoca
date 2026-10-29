"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import { useShallow } from "zustand/react/shallow";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import type { QuickAction } from "@/ai/constants";
import { customPromptResult, reviseMessage } from "@/ai/reviseMessage";
import { AiQuickActions } from "@/components/cards/content/AiQuickActions";
import { PRIMARY_BUTTON } from "@/components/custom-group/buttonStyles";
import { NoCampaign } from "@/components/NoCampaign";
import { CONTENT_CARD } from "@/lib/editorRoutes";
import { canRedo, canUndo, createTypingTimer } from "@/lib/history";
import {
  initMessageEditor,
  isDirty,
  messageEditorReducer,
  validateField,
  type FieldValues,
} from "@/lib/messageEditorReducer";
import { isWithinLimit, OPT_OUT_LINE, type MessageField } from "@/lib/messageLimits";
import { useCampaignStore } from "@/store/campaignStore";
import type { Campaign, Channel } from "@/types";
import { CustomPromptDialog } from "./CustomPromptDialog";
import { DiscardDialog } from "./DiscardDialog";
import { EditorField, type EditKind, type EditorFieldHandle } from "./EditorField";
import { EditorFooter } from "./EditorFooter";
import { PreviewPanel } from "./PreviewPanel";
import { TokenRow } from "./TokenRow";
import { UndoRedoButtons } from "./UndoRedoButtons";
import { useLeaveGuard } from "./useLeaveGuard";
import { usePlacingMode } from "./usePlacingMode";

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

/** The stored messages as editor fields. A missing message starts empty. */
function toFieldValues(messages: Campaign["messages"]): Record<MessageField, string> {
  return {
    sms: messages.sms?.text ?? "",
    emailSubject: messages.email?.subject ?? "",
    emailBody: messages.email?.body ?? "",
  };
}

/** Which AI chip is waiting for an answer. */
type AiChip = QuickAction | "customPrompt";

const AI_DONE: Record<AiChip, string> = {
  shorter: "Made your message shorter",
  friendlier: "Made your message friendlier",
  moreUrgent: "Made your message more urgent",
  customPrompt: "Message updated",
};

const AI_FAILED = "I couldn’t change that one. Try again.";

/** Edits one channel's message. Shows a way back if the campaign doesn't use it. */
export function MessageEditorPage({ channel }: { channel: Channel }) {
  // Changes on every new visit (e.g. "Edit message"), but not on browser
  // back/forward. Keying on it makes each visit start from the saved message.
  const { bfcacheId } = useRouter();
  const campaign = useCampaignStore(
    useShallow((state) =>
      state.campaign
        ? {
            id: state.campaign.id,
            channels: state.campaign.channels,
            messages: state.campaign.messages,
          }
        : null,
    ),
  );

  return (
    // The document never scrolls (see globals.css), so this page scrolls itself.
    <main className="focus-burgundy h-(--screen) overflow-y-auto">
      <div className="mx-auto max-w-300 px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
        {!campaign ? (
          <NoCampaign />
        ) : campaign.channels.includes(channel) ? (
          <MessageEditor
            key={bfcacheId}
            campaignId={campaign.id}
            channel={channel}
            messages={campaign.messages}
          />
        ) : (
          <>
            <BackLink />
            <NotInCampaign noun={EDITORS[channel].noun} />
          </>
        )}
      </div>
    </main>
  );
}

type BackLinkProps = {
  ref?: RefObject<HTMLAnchorElement | null>;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  /** Marked unavailable; the onClick must then prevent the navigation. */
  disabled?: boolean;
};

function BackLink({ ref, onClick, disabled }: BackLinkProps) {
  return (
    <Link
      ref={ref}
      href={CONTENT_CARD}
      scroll={false}
      onClick={onClick}
      aria-disabled={disabled || undefined}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-burgundy hover:underline aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:no-underline"
    >
      <ArrowLeft aria-hidden="true" className="size-5" />
      Back to campaign
    </Link>
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

type MessageEditorProps = {
  /** Also the preset id, which picks the AI's rewrites. */
  campaignId: string;
  channel: Channel;
  /** Read once, when the page opens. "Dirty" compares against these. */
  messages: Campaign["messages"];
};

function MessageEditor({ campaignId, channel, messages }: MessageEditorProps) {
  const router = useRouter();
  const setup = EDITORS[channel];
  const saveSmsMessage = useCampaignStore((state) => state.saveSmsMessage);
  const saveEmailMessage = useCampaignStore((state) => state.saveEmailMessage);
  const [state, dispatch] = useReducer(
    messageEditorReducer,
    setup.fields.map((f) => f.field),
    (fields) => initMessageEditor(fields, toFieldValues(messages)),
  );
  // Phones and tablets only; from lg up both sections show side by side.
  const [tab, setTab] = useState<Tab>("edit");
  const fieldRefs = useRef<Partial<Record<MessageField, EditorFieldHandle | null>>>({});
  const [lastFocused, setLastFocused] = useState<MessageField | null>(null);
  const { announcement, announce } = useAnnouncer();
  const { placing, togglePlacing, cancelPlacing, placed } = usePlacingMode(announce);

  // Set once the owner saves or chooses to go back, so nothing asks again.
  const [leaving, setLeaving] = useState(false);
  const dirty = isDirty(state) && !leaving;
  const backRef = useRef<HTMLAnchorElement>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const customPromptRef = useRef<HTMLButtonElement>(null);
  const actionRefs = useRef<Partial<Record<QuickAction, HTMLButtonElement | null>>>({});
  const [promptOpen, setPromptOpen] = useState(false);
  // Kept here, so Cancel and reopen keeps what was typed.
  const [prompt, setPrompt] = useState("");
  // While set, the AI is working: nothing else may change the message.
  const [aiBusy, setAiBusy] = useState<AiChip | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  function askToDiscard() {
    cancelPlacing();
    setDiscardOpen(true);
  }

  useLeaveGuard(dirty, () => {
    if (!aiBusy) askToDiscard();
  });

  function handleBack(event: MouseEvent<HTMLAnchorElement>) {
    if (!dirty && !aiBusy) return;
    event.preventDefault();
    if (!aiBusy) askToDiscard();
  }

  function leave() {
    setLeaving(true);
    router.push(CONTENT_CARD, { scroll: false });
  }

  // Typing becomes an undo step once the owner pauses. Other edits, undo,
  // redo and Save flush it in the reducer, so the timer is just dropped.
  const [typingTimer] = useState(() => createTypingTimer(() => dispatch({ type: "typingPaused" })));
  useEffect(() => () => typingTimer.cancel(), [typingTimer]);

  function handleChange(field: MessageField, next: string, kind: EditKind) {
    setAiError(null);
    if (kind === "typing") {
      dispatch({ type: "fieldChanged", field, value: next });
      typingTimer.restart();
    } else {
      typingTimer.cancel();
      dispatch({ type: kind, field, value: next });
    }
  }

  function handleHistory(direction: "undo" | "redo") {
    const possible = direction === "undo" ? canUndo(state.history) : canRedo(state.history);
    if (!possible || aiBusy) return;
    typingTimer.cancel();
    dispatch({ type: direction });
    announce(direction === "undo" ? "Undone" : "Redone");
  }

  // After undo or redo: the editors reload in microtasks queued by their own
  // effects, which run before this one, so this microtask runs after. Put the caret at the end of the field that changed; move focus there only
  // if an editor had it, so Undo pressed from the keyboard keeps its focus.
  const handledRevision = useRef(state.syncRevision);
  useEffect(() => {
    if (handledRevision.current === state.syncRevision) return;
    handledRevision.current = state.syncRevision;
    const { restored } = state;
    const target =
      restored.length !== 1 && lastFocused && restored.includes(lastFocused) ? lastFocused : restored[0];
    const editorHadFocus = state.fields.some((field) => fieldRefs.current[field]?.hasFocus());
    queueMicrotask(() => fieldRefs.current[target]?.placeCaretAtEnd(editorHadFocus));
  }, [state, lastFocused]);


  /**
   * Waits for the AI with the controls locked, then applies its rewrite as one
   * undo step. Typing so far becomes its own step first.
   */
  async function runAi(chip: AiChip, ask: () => Promise<FieldValues | null>) {
    cancelPlacing();
    typingTimer.cancel();
    dispatch({ type: "typingPaused" });
    setAiError(null);
    setAiBusy(chip);
    const values = await ask();
    if (values) dispatch({ type: "aiApplied", values });
    else setAiError(AI_FAILED);
    setAiBusy(null);
    const chipButton = chip === "customPrompt" ? customPromptRef.current : actionRefs.current[chip];
    chipButton?.focus();
    if (values) announce(AI_DONE[chip]);
  }

  function handleQuickAction(action: QuickAction) {
    void runAi(action, async () => {
      if (channel === "sms") {
        const result = await reviseMessage({ presetId: campaignId, channel, action });
        return result.ok ? { sms: result.value } : null;
      }
      const result = await reviseMessage({ presetId: campaignId, channel, action });
      return result.ok ? { emailSubject: result.value.subject, emailBody: result.value.body } : null;
    });
  }

  /** Text message: replaces the message. Email: replaces the body only. */
  function handleCustomPrompt(text: string) {
    const field: MessageField = channel === "sms" ? "sms" : "emailBody";
    void runAi("customPrompt", async () => ({ [field]: await customPromptResult({ prompt: text }) }));
  }

  const value = (field: MessageField) => state.values[field] ?? "";
  const paused = state.fields.some((field) => !isWithinLimit(field, value(field)));
  const errorId = (field: MessageField) => `${field}-error`;

  function handleSave() {
    typingTimer.cancel();
    const failing = state.fields.filter((field) => validateField(field, value(field)));
    dispatch({ type: "saveAttempted" });
    if (failing.length > 0) {
      // The editor must be showing before it can take focus.
      flushSync(() => setTab("edit"));
      fieldRefs.current[failing[0]]?.focus();
      return;
    }
    const trimmed = (field: MessageField) => value(field).trim();
    if (channel === "sms") {
      saveSmsMessage(trimmed("sms"));
    } else {
      saveEmailMessage({ subject: trimmed("emailSubject"), body: trimmed("emailBody") });
    }
    leave();
  }

  const errors = state.fields.flatMap((field) => {
    const text = state.errors[field];
    return text ? [{ id: errorId(field), text }] : [];
  });
  if (aiError) errors.push({ id: "ai-error", text: aiError });
  const busy = aiBusy !== null;

  return (
    <>
      <BackLink ref={backRef} onClick={handleBack} disabled={busy} />
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{setup.title}</h1>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <Tabs.Root
        value={tab}
        onValueChange={(next) => {
          cancelPlacing();
          setTab(next as Tab);
        }}
      >
        <SegmentedTabs label="Edit or preview" options={TAB_OPTIONS} className="mt-4 w-fit lg:hidden" />
        <div className="mt-4 grid gap-6 lg:mt-6 lg:grid-cols-2 lg:gap-8">
          {/* Both sections stay mounted, so the editor keeps its text and
              cursor while the Preview tab is open. */}
          <Panel value="edit" tabIndex={-1} className="flex flex-col">
            <TokenRow
              placing={placing}
              onToggle={togglePlacing}
              disabled={busy}
              actions={
                <UndoRedoButtons
                  canUndo={!busy && canUndo(state.history)}
                  canRedo={!busy && canRedo(state.history)}
                  onUndo={() => handleHistory("undo")}
                  onRedo={() => handleHistory("redo")}
                />
              }
            />
            <div className="mt-3 flex flex-1 flex-col gap-4">
              {setup.fields.map((f) => (
                <EditorField
                  key={f.field}
                  ref={(handle) => {
                    fieldRefs.current[f.field] = handle;
                  }}
                  {...f}
                  value={value(f.field)}
                  onChange={(next, kind) => handleChange(f.field, next, kind)}
                  syncRevision={state.syncRevision}
                  placingToken={placing}
                  onTokenPlaced={() => placing && placed(placing)}
                  onFocus={() => setLastFocused(f.field)}
                  onUndo={() => handleHistory("undo")}
                  onRedo={() => handleHistory("redo")}
                  busy={busy}
                  error={state.errors[f.field]}
                  errorId={errorId(f.field)}
                  boxClassName="flex-1 min-h-39"
                />
              ))}
            </div>
            <div className="mt-4">
              <AiQuickActions
                onAction={handleQuickAction}
                onCustomPrompt={() => {
                  cancelPlacing();
                  setPromptOpen(true);
                }}
                customPromptRef={customPromptRef}
                actionRefs={actionRefs}
                busy={busy}
              />
            </div>
            <EditorFooter errors={errors} onSave={handleSave} disabled={busy} />
          </Panel>
          <Panel value="preview" aria-label={setup.previewLabel}>
            <PreviewPanel channel={channel} preview={state.preview} paused={paused} />
          </Panel>
        </div>
      </Tabs.Root>
      <DiscardDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onDiscard={leave}
        returnFocusRef={backRef}
      />
      <CustomPromptDialog
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        prompt={prompt}
        onPromptChange={setPrompt}
        onSend={(text) => {
          setPrompt("");
          setPromptOpen(false);
          handleCustomPrompt(text);
        }}
        returnFocusRef={customPromptRef}
      />
    </>
  );
}

/**
 * Text for an aria-live region. Saying the same thing twice (Undone, Undone)
 * alternates a trailing space so it is read again.
 */
function useAnnouncer() {
  const [message, setMessage] = useState({ text: "", count: 0 });
  const announce = useCallback(
    (text: string) => setMessage((last) => ({ text, count: last.count + 1 })),
    [],
  );
  return { announcement: message.text + (message.count % 2 ? "\u00a0" : ""), announce };
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
