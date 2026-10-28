"use client";

import * as Tabs from "@radix-ui/react-tabs";
import Link from "next/link";
import { useState } from "react";
import { AgentBubble } from "@/components/AgentBubble";
import { StackCard } from "@/components/StackCard";
import { editMessagePath } from "@/lib/editorRoutes";
import { renderMessage } from "@/lib/renderMessage";
import type { Channel } from "@/types";
import { AiQuickActions, type QuickAction } from "./content/AiQuickActions";
import { ChannelTabs } from "./content/ChannelTabs";
import { EmailPreview } from "./content/EmailPreview";
import { SmsBubble } from "./content/SmsBubble";
import { SAMPLE_FIRST_NAME } from "./content/dummyContent";
import { PREVIEW_BOX } from "./content/previewBox";

/** Fills the preview box; long messages are cut to fit (see useClampToFit). */
const panelClass = "flex min-h-0 flex-1 flex-col justify-center-safe rounded-xl";

type ContentCardProps = {
  channels: readonly [Channel, ...Channel[]];
  smsMessage: string;
  emailSubject: string;
  emailBody: string;
  onAction?: (action: QuickAction) => void;
};

export function ContentCard({
  channels,
  smsMessage,
  emailSubject,
  emailBody,
  onAction,
}: ContentCardProps) {
  const [tab, setTab] = useState<Channel>(channels[0]);
  // Falls back if the selected channel is removed.
  const selected = channels.includes(tab) ? tab : channels[0];

  return (
    <StackCard
      step={3}
      title="How our messages will look"
      headerAside={<ChannelTabs channels={channels} />}
      wrapSection={(section) => (
        <Tabs.Root asChild value={selected} onValueChange={(value) => setTab(value as Channel)}>
          {section}
        </Tabs.Root>
      )}
    >
      {/* Stacked on most screens. Short landscape screens go side by side. */}
      <div className="flex h-full flex-col gap-[clamp(0.625rem,2svh,1.25rem)] landscape:short:grid landscape:short:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] landscape:short:grid-rows-[minmax(0,1fr)] landscape:short:gap-5">
        {/* Fills the space left over, so it is the same height on both tabs. */}
        <div className={`${PREVIEW_BOX} flex min-h-0 flex-1 flex-col lg:max-h-120 short:p-2.5`}>
          <Tabs.Content value="sms" data-fit-box className={panelClass}>
            <SmsBubble text={renderMessage(smsMessage, SAMPLE_FIRST_NAME)} />
          </Tabs.Content>
          <Tabs.Content value="email" data-fit-box className={panelClass}>
            <EmailPreview
              subject={renderMessage(emailSubject, SAMPLE_FIRST_NAME)}
              body={renderMessage(emailBody, SAMPLE_FIRST_NAME)}
            />
          </Tabs.Content>
        </div>
        <div className="flex shrink-0 flex-col gap-[clamp(0.625rem,2svh,1.25rem)] short:gap-2">
          <AiQuickActions onAction={onAction} />
          <AgentBubble>
            Want a different message?{" "}
            <Link
              href={editMessagePath(selected)}
              className="relative mt-1 inline-block rounded-full bg-yellow px-3 py-1.5 font-bold text-ink after:absolute after:inset-x-0 after:-inset-y-1.5 short:mt-0.5 short:py-0.5 short:after:-inset-y-2.5"
            >
              Edit message
            </Link>
          </AgentBubble>
        </div>
      </div>
    </StackCard>
  );
}
