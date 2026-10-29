"use client";

import { Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type RefObject } from "react";
import { useShallow } from "zustand/react/shallow";
import { useToday } from "@/components/custom-group/useToday";
import { AGENT_BUTTON } from "@/components/custom-group/buttonStyles";
import { NoCampaign } from "@/components/NoCampaign";
import { StackCard } from "@/components/StackCard";
import clientsData from "@/data/clients.json";
import { getLaunchCheck } from "@/lib/launch";
import { getAudienceStats } from "@/lib/reach";
import { findSegment } from "@/lib/segments";
import { useCampaignStore } from "@/store/campaignStore";
import type { Campaign, Client, Segment } from "@/types";
import { LaunchDialog, preloadRocket } from "./launch/LaunchDialog";
import { CancelScheduleDialog, LaunchStatus } from "./launch/LaunchStatus";
import { PlanSummary } from "./launch/PlanSummary";
import { useLaunchFlow } from "./launch/useLaunchFlow";

const CLIENTS: Client[] = clientsData;
const TITLE = "Here’s your plan";
const HEADING_ID = "step-6-title";

export function LaunchCard() {
  const today = useToday();
  const campaign = useCampaignStore(
    useShallow((state) =>
      state.campaign
        ? {
            name: state.campaign.name,
            channels: state.campaign.channels,
            messages: state.campaign.messages,
            sendTime: state.campaign.sendTime,
            status: state.campaign.status,
            segmentId:
              state.campaign.audience?.type === "segment"
                ? state.campaign.audience.segmentId
                : null,
          }
        : null,
    ),
  );
  const savedSegments = useCampaignStore((state) => state.savedSegments);
  const segmentId = campaign?.segmentId;
  const segment = useMemo(
    () => (segmentId ? findSegment(segmentId, savedSegments) : undefined),
    [segmentId, savedSegments],
  );
  const stats = useMemo(
    () => (segment && today ? getAudienceStats(segment, CLIENTS, today) : null),
    [segment, today],
  );

  if (!campaign || !segment) {
    return (
      <StackCard step={6} title={TITLE}>
        <NoCampaign />
      </StackCard>
    );
  }

  return (
    <StackCard step={6} title={TITLE}>
      <PlanSummary
        campaign={campaign}
        groupName={segment.name}
        counts={stats && { sms: stats.texted, email: stats.mailed }}
      />
      <LaunchArea campaign={campaign} segment={segment} />
    </StackCard>
  );
}

type LaunchAreaProps = {
  campaign: Pick<Campaign, "channels" | "sendTime" | "status">;
  segment: Segment;
};

/** Pinned under the summary: the Launch button, or the status once launched. */
function LaunchArea({ campaign, segment }: LaunchAreaProps) {
  const { launchCampaign, cancelSchedule, resetCampaign } = useCampaignStore(
    useShallow((state) => ({
      launchCampaign: state.launchCampaign,
      cancelSchedule: state.cancelSchedule,
      resetCampaign: state.resetCampaign,
    })),
  );
  const router = useRouter();
  const launch = useLaunchFlow();
  const [cancelOpen, setCancelOpen] = useState(false);
  const launchButtonRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  // Picked when a dialog closes, looked up once it has faded out: by then the
  // element (e.g. the Launch button after cancelling) is on the page.
  const focusTarget = useRef<"launch" | "status" | "heading" | "cancel">("launch");
  const returnFocusRef = useMemo<RefObject<HTMLElement | null>>(
    () => ({
      get current() {
        switch (focusTarget.current) {
          case "launch":
            return launchButtonRef.current;
          case "status":
            return statusRef.current;
          case "cancel":
            return cancelButtonRef.current;
          case "heading":
            return document.getElementById(HEADING_ID);
        }
      },
    }),
    [],
  );

  const scheduled = campaign.sendTime?.mode === "scheduled";

  /** Always with a fresh date and fresh counts, never from the last render. */
  function checkNow(now: Date) {
    return getLaunchCheck(campaign, getAudienceStats(segment, CLIENTS, now), now);
  }

  function openLaunch() {
    preloadRocket();
    launch.open(checkNow(new Date()));
  }

  function confirmLaunch() {
    const now = new Date();
    launch.confirm(checkNow(now), scheduled ? "scheduled" : "sent", () => launchCampaign(now));
  }

  function closeLaunch() {
    const { phase } = launch.flow.step;
    // Done: the status block. Blocked: the heading, near the edit buttons.
    // Cancelled: back to Launch.
    focusTarget.current = phase === "done" ? "status" : phase === "blocked" ? "heading" : "launch";
    launch.close();
  }

  function closeCancel(cancelled: boolean) {
    if (cancelled) cancelSchedule();
    focusTarget.current = cancelled ? "launch" : "cancel";
    setCancelOpen(false);
  }

  function startNew() {
    // Navigate first: CampaignGuard renders nothing once the campaign is gone.
    router.push("/");
    resetCampaign();
  }

  return (
    <div className="flex shrink-0 flex-col pt-3 short:pt-2">
      {campaign.status === "draft" ? (
        <button
          ref={launchButtonRef}
          type="button"
          onClick={openLaunch}
          className={`${AGENT_BUTTON} min-h-12 w-full px-8 text-lg @xl:w-auto @xl:self-end short:min-h-11 short:text-base`}
        >
          <Rocket aria-hidden="true" className="size-5" />
          {scheduled ? "Schedule" : "Launch"}
        </button>
      ) : (
        <LaunchStatus
          ref={statusRef}
          status={campaign.status}
          channels={campaign.channels}
          sendTime={campaign.sendTime}
          cancelButtonRef={cancelButtonRef}
          onCancelSchedule={() => setCancelOpen(true)}
          onStartNew={startNew}
        />
      )}
      <LaunchDialog
        flow={launch.flow}
        onConfirm={confirmLaunch}
        onFinished={launch.finish}
        onClose={closeLaunch}
        returnFocusRef={returnFocusRef}
      />
      <CancelScheduleDialog
        open={cancelOpen}
        onKeep={() => closeCancel(false)}
        onCancelSchedule={() => closeCancel(true)}
        returnFocusRef={returnFocusRef}
      />
    </div>
  );
}
