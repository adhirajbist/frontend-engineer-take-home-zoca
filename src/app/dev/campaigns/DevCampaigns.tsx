"use client";

import Link from "next/link";
import { useShallow } from "zustand/react/shallow";
import { useToday } from "@/components/custom-group/useToday";
import clientsData from "@/data/clients.json";
import { PRESET_CAMPAIGNS } from "@/data/presetCampaigns";
import { CHANNEL_NAMES, describeFilter } from "@/lib/filters";
import { getAudienceStats } from "@/lib/reach";
import { findSegment, getAllSegments } from "@/lib/segments";
import { useCampaignStore } from "@/store/campaignStore";
import type { Campaign, Client, Segment } from "@/types";

const CLIENTS: Client[] = clientsData;
const SMALL_GROUP = 10;

export function DevCampaigns() {
  const today = useToday();
  const campaign = useCampaignStore((state) => state.campaign);
  const savedSegments = useCampaignStore((state) => state.savedSegments);
  const actions = useCampaignStore(
    useShallow((state) => ({
      selectPresetCampaign: state.selectPresetCampaign,
      resetCampaign: state.resetCampaign,
      clearSavedSegments: state.clearSavedSegments,
    })),
  );

  return (
    <main className="focus-burgundy h-(--screen) space-y-6 overflow-y-auto p-4">
      <p>
        <strong>State is in memory only. A reload resets it. Use the link to move around.</strong>
      </p>
      <p>
        <Link href="/" className="underline">
          Go to the home page
        </Link>
      </p>

      <h1 className="text-2xl font-bold">Campaign store check</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Pick a campaign</h2>
        <div className="flex flex-wrap gap-2">
          {PRESET_CAMPAIGNS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="border px-2 py-1"
              onClick={() => actions.selectPresetCampaign(preset.id)}
            >
              {preset.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="border px-2 py-1" onClick={actions.resetCampaign}>
            Reset campaign
          </button>
          <button type="button" className="border px-2 py-1" onClick={actions.clearSavedSegments}>
            Clear saved groups
          </button>
        </div>
      </section>

      {campaign && today && (
        <CampaignDetails campaign={campaign} savedSegments={savedSegments} today={today} />
      )}

      {today && <SegmentTable segments={getAllSegments(savedSegments)} today={today} />}

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Store state</h2>
        <pre className="overflow-x-auto border p-2 text-sm">
          {JSON.stringify({ campaign, savedSegments }, null, 2)}
        </pre>
      </section>
    </main>
  );
}

function CampaignDetails({
  campaign,
  savedSegments,
  today,
}: {
  campaign: Campaign;
  savedSegments: Segment[];
  today: Date;
}) {
  const segmentId = campaign.audience?.type === "segment" ? campaign.audience.segmentId : null;
  const segment = segmentId ? findSegment(segmentId, savedSegments) : undefined;
  const stats = segment ? getAudienceStats(segment, CLIENTS, today) : null;
  const sendsText = campaign.channels.includes("sms");
  const sendsEmail = campaign.channels.includes("email");
  const sendTime = campaign.sendTime;

  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold">Selected campaign</h2>
      <dl className="grid gap-1">
        <dt className="font-bold">Id</dt>
        <dd>{campaign.id}</dd>
        <dt className="font-bold">Name</dt>
        <dd>{campaign.name}</dd>
        <dt className="font-bold">Sends by</dt>
        <dd>{campaign.channels.map((channel) => CHANNEL_NAMES[channel]).join(" and ")}</dd>
        <dt className="font-bold">Text message{sendsText ? "" : " (kept, not sent)"}</dt>
        <dd className="whitespace-pre-wrap">{campaign.messages.sms?.text ?? "None"}</dd>
        <dt className="font-bold">Email subject{sendsEmail ? "" : " (kept, not sent)"}</dt>
        <dd>{campaign.messages.email?.subject ?? "None"}</dd>
        <dt className="font-bold">Email body{sendsEmail ? "" : " (kept, not sent)"}</dt>
        <dd className="whitespace-pre-wrap">{campaign.messages.email?.body ?? "None"}</dd>
        <dt className="font-bold">Send time</dt>
        <dd>
          {sendTime === null ? "Not set" : sendTime.mode === "now" ? "Now" : sendTime.iso}
        </dd>
      </dl>

      <h3 className="text-lg font-bold">Group</h3>
      {segment ? (
        <>
          <p>
            {segment.name} ({segment.id})
          </p>
          {segment.filters.length === 0 ? (
            <p>No conditions: everyone.</p>
          ) : (
            <ul className="list-disc pl-5">
              {segment.filters.map((filter) => (
                <li key={filter.id}>{describeFilter(filter)}</li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p>No group found for {segmentId ?? "this campaign"}.</p>
      )}

      {stats && (
        <>
          <h3 className="text-lg font-bold">Numbers</h3>
          <p>Clients in the group: {stats.matching}</p>
          {sendsText && <p>Will be texted: {stats.texted}</p>}
          {sendsEmail && <p>Will be mailed: {stats.mailed}</p>}
          <p>
            Only showing counts for how this campaign sends (
            {campaign.channels.map((channel) => CHANNEL_NAMES[channel]).join(" and ")}).
          </p>
        </>
      )}
    </section>
  );
}

function SegmentTable({ segments, today }: { segments: Segment[]; today: Date }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold">All groups</h2>
      <div className="overflow-x-auto">
        <table className="border-collapse text-left">
          <thead>
            <tr>
              <th className="border px-2">Group</th>
              <th className="border px-2">Id</th>
              <th className="border px-2">Clients</th>
              <th className="border px-2">Can text</th>
              <th className="border px-2">Can email</th>
              <th className="border px-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((segment) => {
              const stats = getAudienceStats(segment, CLIENTS, today);
              return (
                <tr key={segment.id}>
                  <td className="border px-2">{segment.name}</td>
                  <td className="border px-2">{segment.id}</td>
                  <td className="border px-2">{stats.matching}</td>
                  <td className="border px-2">{stats.texted}</td>
                  <td className="border px-2">{stats.mailed}</td>
                  <td className="border px-2">{stats.matching < SMALL_GROUP ? "small" : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
