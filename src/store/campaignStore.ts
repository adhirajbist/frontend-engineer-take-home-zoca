/**
 * The campaign being built and the owner's saved groups.
 *
 * TODO: persist this (for example to localStorage) once the flow is wired up.
 * For now it lives in memory only, so a reload resets everything.
 *
 * Components must read it with selectors, e.g.
 * useCampaignStore((state) => state.campaign?.audience), and wrap selectors
 * that build a new object or array in useShallow.
 */
import { create } from "zustand";
import { buildAgentNotes, buildCampaignFromPreset } from "@/data/presetCampaigns";
import { CAMPAIGN_NAME_MAX_LENGTH } from "@/lib/campaignName";
import { cloneFilters, newFilterId } from "@/lib/filters";
import { isNameTaken } from "@/lib/segments";
import { useAgentNotesStore } from "@/store/agentNotesStore";
import type { Campaign, Channel, EmailMessage, Filter, Segment, SendTime } from "@/types";

export type AddSegmentResult =
  | { ok: true; segment: Segment }
  | { ok: false; reason: "duplicate-name" };

/** What an action returns when it can refuse a change. */
export type ActionResult<Reason extends string> = { ok: true } | { ok: false; reason: Reason };

type CampaignState = {
  campaign: Campaign | null;
  savedSegments: Segment[];
  selectPresetCampaign: (presetId: string) => void;
  saveSmsMessage: (text: string) => void;
  saveEmailMessage: (email: EmailMessage) => void;
  /** Hides Steve's group reason, unless it is the same group. */
  setAudienceSegment: (segmentId: string) => void;
  /** Trims the name. At most CAMPAIGN_NAME_MAX_LENGTH characters. */
  setCampaignName: (name: string) => ActionResult<"empty" | "too-long" | "no-campaign">;
  /** Never touches the messages. Hides Steve's channel reason if they change. */
  setChannels: (channels: readonly Channel[]) => ActionResult<"empty" | "no-campaign">;
  /** Hides Steve's send time reason if it changes. */
  setSendTime: (sendTime: SendTime) => ActionResult<"no-campaign">;
  /** Sent if the send time is now (or not picked), otherwise scheduled. */
  launchCampaign: (now: Date) => void;
  /** Makes a scheduled campaign a draft again. Does nothing otherwise. */
  cancelSchedule: () => void;
  /** Adds a saved group. Does not change the campaign's audience. */
  addSavedSegment: (name: string, filters: readonly Filter[]) => AddSegmentResult;
  /** Clears the campaign and Steve's notes. Saved groups stay. */
  resetCampaign: () => void;
  clearSavedSegments: () => void;
};

/** randomUUID needs a secure context, which a phone on the local network is not. */
function newSegmentId(): string {
  const unique =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : newFilterId();
  return `saved-${unique}`;
}

/** Applies a change to the campaign, or does nothing when there is none. */
function updateCampaign(change: (campaign: Campaign) => Campaign) {
  return (state: CampaignState) => (state.campaign ? { campaign: change(state.campaign) } : {});
}

/**
 * Every edit to what gets sent (name, channels, messages, group, send time)
 * goes through here: a scheduled or sent campaign becomes a draft again.
 */
function commitEdit(change: (campaign: Campaign) => Campaign) {
  return updateCampaign((campaign) => {
    const { launchedAt, ...rest } = change(campaign);
    void launchedAt;
    return { ...rest, status: "draft" };
  });
}

const CHANNEL_ORDER: readonly Channel[] = ["sms", "email"];

function sameSendTime(a: SendTime | null, b: SendTime): boolean {
  if (a === null || a.mode !== b.mode) return false;
  return a.mode === "now" || (b.mode === "scheduled" && a.iso === b.iso);
}

export const useCampaignStore = create<CampaignState>()((set, get) => ({
  campaign: null,
  savedSegments: [],

  // Steve's notes come back fresh, with every reason showing.
  selectPresetCampaign: (presetId) => {
    set({ campaign: buildCampaignFromPreset(presetId, new Date()) });
    useAgentNotesStore.getState().setNotes(buildAgentNotes(presetId));
  },

  saveSmsMessage: (text) =>
    set(
      commitEdit((campaign) => ({
        ...campaign,
        messages: { ...campaign.messages, sms: { text } },
      })),
    ),

  saveEmailMessage: ({ subject, body }) =>
    set(
      commitEdit((campaign) => ({
        ...campaign,
        messages: { ...campaign.messages, email: { subject, body } },
      })),
    ),

  setAudienceSegment: (segmentId) => {
    const audience = get().campaign?.audience;
    if (audience?.type === "segment" && audience.segmentId === segmentId) return;
    set(commitEdit((campaign) => ({ ...campaign, audience: { type: "segment", segmentId } })));
    useAgentNotesStore.getState().dismissReason("audience");
  },

  setCampaignName: (name) => {
    const campaign = get().campaign;
    if (!campaign) return { ok: false, reason: "no-campaign" };
    const trimmed = name.trim();
    if (trimmed === "") return { ok: false, reason: "empty" };
    if (trimmed.length > CAMPAIGN_NAME_MAX_LENGTH) return { ok: false, reason: "too-long" };
    if (trimmed !== campaign.name) set(commitEdit((current) => ({ ...current, name: trimmed })));
    return { ok: true };
  },

  setChannels: (channels) => {
    const campaign = get().campaign;
    if (!campaign) return { ok: false, reason: "no-campaign" };
    const sorted = CHANNEL_ORDER.filter((channel) => channels.includes(channel));
    if (sorted.length === 0) return { ok: false, reason: "empty" };
    if (sorted.join() !== campaign.channels.join()) {
      set(commitEdit((current) => ({ ...current, channels: sorted })));
      useAgentNotesStore.getState().dismissReason("channel");
    }
    return { ok: true };
  },

  setSendTime: (sendTime) => {
    const campaign = get().campaign;
    if (!campaign) return { ok: false, reason: "no-campaign" };
    if (!sameSendTime(campaign.sendTime, sendTime)) {
      set(commitEdit((current) => ({ ...current, sendTime: { ...sendTime } })));
      useAgentNotesStore.getState().dismissReason("time");
    }
    return { ok: true };
  },

  // Not edits, so they skip commitEdit.
  launchCampaign: (now) =>
    set(
      updateCampaign((campaign) => ({
        ...campaign,
        status: campaign.sendTime?.mode === "scheduled" ? "scheduled" : "sent",
        launchedAt: now.toISOString(),
      })),
    ),

  cancelSchedule: () =>
    set(
      updateCampaign((campaign) => {
        if (campaign.status !== "scheduled") return campaign;
        const { launchedAt, ...rest } = campaign;
        void launchedAt;
        return { ...rest, status: "draft" };
      }),
    ),

  addSavedSegment: (name, filters) => {
    const trimmed = name.trim();
    if (isNameTaken(trimmed, get().savedSegments)) return { ok: false, reason: "duplicate-name" };
    const segment: Segment = { id: newSegmentId(), name: trimmed, filters: cloneFilters(filters) };
    set((state) => ({ savedSegments: [...state.savedSegments, segment] }));
    return { ok: true, segment };
  },

  resetCampaign: () => {
    set({ campaign: null });
    useAgentNotesStore.getState().clearNotes();
  },

  clearSavedSegments: () => set({ savedSegments: [] }),
}));
