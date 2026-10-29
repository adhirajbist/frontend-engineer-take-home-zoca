"use client";

import * as Tabs from "@radix-ui/react-tabs";
import Link from "next/link";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { QuickAction } from "@/ai/constants";
import { reviseMessage } from "@/ai/reviseMessage";
import { AgentBubble } from "@/components/AgentBubble";
import { NoCampaign } from "@/components/NoCampaign";
import { StackCard } from "@/components/StackCard";
import { ShimmerBox } from "@/components/ui/ShimmerBox";
import { editMessagePath } from "@/lib/editorRoutes";
import { renderMessage } from "@/lib/renderMessage";
import { useCardNote } from "@/store/agentNotesStore";
import { useCampaignStore } from "@/store/campaignStore";
import type { Campaign, Channel } from "@/types";
import { CardQuickEdits } from "./content/CardQuickEdits";
import { ChannelTabs } from "./content/ChannelTabs";
import { EmailPreview } from "./content/EmailPreview";
import { SmsBubble } from "./content/SmsBubble";
import { SAMPLE_FIRST_NAME } from "./content/dummyContent";
import { PREVIEW_BOX } from "./content/previewBox";
import { useAnnouncer } from "./content/useAnnouncer";

/** Fills the preview box; long messages are cut to fit (see useClampToFit). */
const panelClass = "flex min-h-0 flex-1 flex-col justify-center-safe rounded-xl";

const TITLE = "How our messages will look";

const QUICK_EDIT_DONE: Record<QuickAction, string> = {
  shorter: "Made your message shorter",
  friendlier: "Made your message friendlier",
  moreUrgent: "Made your message more urgent",
};

const QUICK_EDIT_FAILED = "I couldn't change that one. Try again.";

/** Only the campaign's channels get a tab. Other messages stay in the store, unseen. */
export function ContentCard() {
  const content = useCampaignStore(
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

  if (!content || content.channels.length === 0) {
    return (
      <StackCard step={3} title={TITLE}>
        <NoCampaign />
      </StackCard>
    );
  }
  const [first, ...rest] = content.channels;
  // Keyed, so a new campaign starts with fresh quick edits.
  return (
    <ContentPreview
      key={content.id}
      campaignId={content.id}
      channels={[first, ...rest]}
      messages={content.messages}
    />
  );
}

type ContentPreviewProps = {
  campaignId: string;
  channels: readonly [Channel, ...Channel[]];
  messages: Campaign["messages"];
};

function ContentPreview({ campaignId, channels, messages }: ContentPreviewProps) {
  const smsMessage = messages.sms?.text ?? "";
  const emailSubject = messages.email?.subject ?? "";
  const emailBody = messages.email?.body ?? "";
  const [tab, setTab] = useState<Channel>(channels[0]);
  const note = useCardNote("content");
  // Falls back if the selected channel is removed.
  const selected = channels.includes(tab) ? tab : channels[0];
  const canUndo = useCampaignStore((state) => state.quickEditHistory[selected].length > 0);
  const applyQuickEditResult = useCampaignStore((state) => state.applyQuickEditResult);
  const undoQuickEdit = useCampaignStore((state) => state.undoQuickEdit);
  // While true, the AI is rewriting the selected message: nothing else may change it.
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const { announcement, announce } = useAnnouncer();

  async function runQuickEdit<C extends Channel>(channel: C, action: QuickAction) {
    setFailed(false);
    setBusy(true);
    const result = await reviseMessage({ presetId: campaignId, channel, action });
    setBusy(false);
    // Another campaign may have been picked during the wait.
    if (useCampaignStore.getState().campaign?.id !== campaignId) return;
    if (result.ok) {
      applyQuickEditResult(channel, result.value);
      announce(QUICK_EDIT_DONE[action]);
    } else {
      setFailed(true);
      announce(QUICK_EDIT_FAILED);
    }
  }

  function handleUndo() {
    setFailed(false);
    undoQuickEdit(selected);
    announce("Went back to your earlier message");
  }

  return (
    <StackCard
      step={3}
      title={TITLE}
      headerAside={<ChannelTabs channels={channels} disabled={busy} />}
      wrapSection={(section) => (
        <Tabs.Root
          asChild
          value={selected}
          onValueChange={(value) => {
            setFailed(false);
            setTab(value as Channel);
          }}
        >
          {section}
        </Tabs.Root>
      )}
    >
      {/* Stacked on most screens. Short landscape screens go side by side; the
          side column is never narrower than the quick edits row. */}
      <div className="flex h-full flex-col gap-[clamp(0.625rem,2svh,1.25rem)] landscape:short:grid landscape:short:grid-cols-[minmax(0,3fr)_minmax(min-content,2fr)] landscape:short:grid-rows-[minmax(0,1fr)] landscape:short:gap-5">
        {/* Fills the space left over, so it is the same height on both tabs. */}
        <ShimmerBox
          active={busy}
          className={`${PREVIEW_BOX} flex min-h-0 flex-1 flex-col lg:max-h-120 short:p-2.5`}
        >
          <Tabs.Content value="sms" data-fit-box className={panelClass}>
            <SmsBubble text={renderMessage(smsMessage, SAMPLE_FIRST_NAME)} />
          </Tabs.Content>
          <Tabs.Content value="email" data-fit-box className={panelClass}>
            <EmailPreview
              subject={renderMessage(emailSubject, SAMPLE_FIRST_NAME)}
              body={renderMessage(emailBody, SAMPLE_FIRST_NAME)}
            />
          </Tabs.Content>
        </ShimmerBox>
        <div className="flex shrink-0 flex-col gap-[clamp(0.625rem,2svh,1.25rem)] short:gap-2">
          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>
          <div>
            <CardQuickEdits
              onOpen={() => announce("Quick edits are ready")}
              onAction={(action) => void runQuickEdit(selected, action)}
              onUndo={handleUndo}
              canUndo={canUndo}
              busy={busy}
            />
            {failed && (
              <p className="mt-1 text-sm text-error short:text-xs">{QUICK_EDIT_FAILED}</p>
            )}
          </div>
          {note && (
            <AgentBubble atCardBottom>
              {note.neutral}{" "}
              <Link
                href={editMessagePath(selected)}
                aria-disabled={busy || undefined}
                onClick={(event) => busy && event.preventDefault()}
                className="relative mt-1 inline-block rounded-2xl bg-yellow px-3 py-1.5 font-bold text-ink aria-disabled:cursor-not-allowed aria-disabled:bg-track after:absolute after:inset-x-0 after:-inset-y-1.5 short:mt-0.5 short:py-0.5 short:after:-inset-y-2.5"
              >
                Edit message
              </Link>
            </AgentBubble>
          )}
        </div>
      </div>
    </StackCard>
  );
}
