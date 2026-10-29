"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  AUDIENCE_TITLE,
  AudienceCard,
  DUMMY_REASON,
  type ChannelCount,
} from "@/components/cards/AudienceCard";
import { useToday } from "@/components/custom-group/useToday";
import { NoCampaign } from "@/components/NoCampaign";
import { StackCard } from "@/components/StackCard";
import clientsData from "@/data/clients.json";
import { getAudienceStats } from "@/lib/reach";
import { findSegment } from "@/lib/segments";
import { useCampaignStore } from "@/store/campaignStore";
import type { Client } from "@/types";

const CLIENTS: Client[] = clientsData;

/** Reads the campaign's group from the store and gives AudienceCard real numbers. */
export function AudienceStep() {
  const router = useRouter();
  const today = useToday();
  const { channels, segmentId } = useCampaignStore(
    useShallow((state) => ({
      channels: state.campaign?.channels,
      segmentId:
        state.campaign?.audience?.type === "segment" ? state.campaign.audience.segmentId : null,
    })),
  );
  const savedSegments = useCampaignStore((state) => state.savedSegments);

  const segment = useMemo(
    () => (segmentId ? findSegment(segmentId, savedSegments) : undefined),
    [segmentId, savedSegments],
  );
  const stats = useMemo(
    () => (segment && today ? getAudienceStats(segment, CLIENTS, today) : null),
    [segment, today],
  );

  if (!channels || !segment) {
    return (
      <StackCard step={4} title={AUDIENCE_TITLE}>
        <NoCampaign />
      </StackCard>
    );
  }

  // No counts until the browser knows today's date.
  const counts: ChannelCount[] = stats
    ? channels.map((channel) => ({
        channel,
        count: channel === "sms" ? stats.texted : stats.mailed,
      }))
    : [];

  return (
    <AudienceCard
      audienceName={segment.name}
      counts={counts}
      reason={DUMMY_REASON}
      onEdit={() => router.push("/audience/custom")}
    />
  );
}
