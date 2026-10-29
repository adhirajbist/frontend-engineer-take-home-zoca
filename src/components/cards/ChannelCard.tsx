"use client";

import { Check, CircleAlert } from "lucide-react";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { AgentBubble } from "@/components/AgentBubble";
import { useToday } from "@/components/custom-group/useToday";
import { NoCampaign } from "@/components/NoCampaign";
import { RadioPill } from "@/components/RadioPill";
import { StackCard } from "@/components/StackCard";
import clientsData from "@/data/clients.json";
import { formatCount } from "@/lib/format";
import { getReachableCount } from "@/lib/reach";
import { findSegment } from "@/lib/segments";
import { useCardNote } from "@/store/agentNotesStore";
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
  const today = useToday();
  const campaign = useCampaignStore(
    useShallow((state) =>
      state.campaign
        ? {
            channels: state.campaign.channels,
            segmentId:
              state.campaign.audience?.type === "segment"
                ? state.campaign.audience.segmentId
                : null,
          }
        : null,
    ),
  );
  const savedSegments = useCampaignStore((state) => state.savedSegments);
  const setChannels = useCampaignStore((state) => state.setChannels);
  const note = useCardNote("channel");

  const segmentId = campaign?.segmentId;
  const segment = useMemo(
    () => (segmentId ? findSegment(segmentId, savedSegments) : undefined),
    [segmentId, savedSegments],
  );
  const channels = campaign?.channels;
  const count = useMemo(
    () => (segment && channels && today ? getReachableCount(segment, CLIENTS, channels, today) : null),
    [segment, channels, today],
  );

  if (!campaign) {
    return (
      <StackCard step={2} title={TITLE}>
        <NoCampaign />
      </StackCard>
    );
  }

  const selected = campaign.channels.join();
  return (
    <StackCard step={2} title={TITLE}>
      <div
        role="radiogroup"
        aria-labelledby="step-2-title"
        className="flex flex-col gap-2 pt-1.5 sm:flex-row short:flex-row"
      >
        {OPTIONS.map((option) => {
          const checked = option.channels.join() === selected;
          return (
            <RadioPill
              key={option.label}
              name="channels"
              checked={checked}
              onChange={() => setChannels(option.channels)}
              className="min-h-11 rounded-full text-base sm:flex-1 sm:text-lg short:flex-1 short:text-base"
            >
              {checked && <Check aria-hidden="true" className="size-5 shrink-0" />}
              {option.label}
            </RadioPill>
          );
        })}
      </div>
      <ReachLine count={count} />
      {note && (
        <AgentBubble atCardBottom className="pt-4 short:pt-2">
          {note.reason && <p className="mb-2 short:mb-1">{note.reason}</p>}
          <p>{note.neutral}</p>
        </AgentBubble>
      )}
    </StackCard>
  );
}

/** Live, so screen readers hear the new count after each change. Null until today is known. */
function ReachLine({ count }: { count: number | null }) {
  return (
    <p
      aria-live="polite"
      className="mt-3 flex min-h-6 items-start gap-2 text-base short:mt-2 short:text-sm"
    >
      {count === 0 && (
        <>
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-error short:size-4" />
          <span>No clients can be messaged this way. Try another channel or group.</span>
        </>
      )}
      {count !== null && count > 0 && (
        <span>
          <strong className="font-extrabold tabular-nums">{formatCount(count)}</strong>{" "}
          {count === 1 ? "client" : "clients"} can be messaged
        </span>
      )}
    </p>
  );
}
