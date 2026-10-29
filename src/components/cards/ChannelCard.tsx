"use client";

import { Check, CircleAlert, Users } from "lucide-react";
import { useMemo } from "react";
import { AgentBubble, NoteLines } from "@/components/AgentBubble";
import { NoCampaign } from "@/components/NoCampaign";
import { RadioPill } from "@/components/RadioPill";
import { ReachCount } from "@/components/ReachCount";
import { StackCard } from "@/components/StackCard";
import clientsData from "@/data/clients.json";
import { countReachable } from "@/lib/reach";
import { useAgentNotesStore, useCardNote } from "@/store/agentNotesStore";
import { useCampaignStore } from "@/store/campaignStore";
import type { Channel, Client } from "@/types";

const CLIENTS: Client[] = clientsData;
const TITLE = "Where we’ll send the messages";

const OPTIONS: readonly { label: string; channels: readonly Channel[] }[] = [
  { label: "Text", channels: ["sms"] },
  { label: "Email", channels: ["email"] },
  { label: "Both", channels: ["sms", "email"] },
];

export function ChannelCard() {
  const channels = useCampaignStore((state) => state.campaign?.channels);
  const setChannels = useCampaignStore((state) => state.setChannels);
  const note = useCardNote("channel");
  // With the reason, even once it is dismissed: the bubble keeps its room.
  const fullNote = useAgentNotesStore((state) => state.notes?.channel ?? null);

  const count = useMemo(() => (channels ? countReachable(CLIENTS, channels) : 0), [channels]);

  if (!channels) {
    return (
      <StackCard step={2} title={TITLE}>
        <NoCampaign />
      </StackCard>
    );
  }

  const selected = channels.join();
  return (
    <StackCard step={2} title={TITLE}>
      {/* Pills in a row: the group is centred above the bubble. Stacked
          pills (narrow cards) stay at the top. */}
      <div className="flex flex-1 flex-col @xl:justify-center-safe short:justify-center-safe">
        <div
          role="radiogroup"
          aria-labelledby="step-2-title"
          className="flex flex-col gap-2 pt-1.5 @xl:flex-row short:flex-row"
        >
          {OPTIONS.map((option) => {
            const checked = option.channels.join() === selected;
            return (
              <RadioPill
                key={option.label}
                name="channels"
                checked={checked}
                onChange={() => setChannels(option.channels)}
                className="min-h-11 rounded-full text-base @xl:flex-1 @xl:text-lg short:flex-1 short:text-base"
              >
                {checked && <Check aria-hidden="true" className="size-5 shrink-0" />}
                {option.label}
              </RadioPill>
            );
          })}
        </div>
        <ReachLine count={count} />
      </div>
      {note && (
        <AgentBubble
          atCardBottom
          className="pt-4 short:pt-2"
          reserveFor={fullNote && <NoteLines note={fullNote} />}
        >
          <NoteLines note={note} />
        </AgentBubble>
      )}
    </StackCard>
  );
}

/** Live, so screen readers hear the new count after each change. */
function ReachLine({ count }: { count: number }) {
  return (
    // Tall enough for the big number, so nothing moves once the count shows.
    <div
      aria-live="polite"
      className="mt-[clamp(1rem,calc(6svh-1rem),2.5rem)] min-h-8 text-base short:mt-2 short:text-sm"
    >
      {count === 0 && (
        <p className="flex items-start gap-2">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-error short:size-4" />
          <span>No clients can be messaged this way. Try another channel.</span>
        </p>
      )}
      {count > 0 && (
        <ReachCount
          icon={Users}
          count={count}
          phrase={count === 1 ? "client can be messaged" : "clients can be messaged"}
        />
      )}
    </div>
  );
}
