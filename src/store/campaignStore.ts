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
import type { ChannelMessage } from "@/data/messageVariants";
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

/** Earlier messages, newest last, that Undo on the Content card steps back to. */
export type QuickEditHistory = { [C in Channel]: ChannelMessage[C][] };

type CampaignState = {
  campaign: Campaign | null;
  savedSegments: Segment[];
  /**
   * Only quick edits from the Content card add to it. Saving from the editor,
   * picking a preset and resetting clear it, so Undo never reverts what the
   * owner wrote.
   */
  quickEditHistory: QuickEditHistory;
  selectPresetCampaign: (presetId: string) => void;
  /** The editor's Save. Clears the text's quick edit history. */
  saveSmsMessage: (text: string) => void;
  /** The editor's Save. Clears the email's quick edit history. */
  saveEmailMessage: (email: EmailMessage) => void;
  /** Saves the AI's rewrite and remembers the message it replaced. Does nothing if identical. */
  applyQuickEditResult: <C extends Channel>(channel: C, value: ChannelMessage[C]) => void;
  /** Puts back the message before the last quick edit on that channel. */
  undoQuickEdit: (channel: Channel) => void;
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

const EMPTY_HISTORY: QuickEditHistory = { sms: [], email: [] };

/** The channel's message in the same shape as ChannelMessage, if there is one. */
function currentMessage<C extends Channel>(campaign: Campaign, channel: C): ChannelMessage[C] | undefined {
  const { sms, email } = campaign.messages;
  const message: Partial<ChannelMessage> = { sms: sms?.text, email: email && { ...email } };
  return message[channel];
}

function sameMessage<C extends Channel>(a: ChannelMessage[C], b: ChannelMessage[C]): boolean {
  if (typeof a === "string" || typeof b === "string") return a === b;
  return a.subject === b.subject && a.body === b.body;
}

function withMessage<C extends Channel>(campaign: Campaign, channel: C, value: ChannelMessage[C]): Campaign {
  const messages =
    typeof value === "string"
      ? { ...campaign.messages, sms: { text: value } }
      : { ...campaign.messages, email: { subject: value.subject, body: value.body } };
  return { ...campaign, messages };
}

/** Saves one channel's message as an edit and replaces that channel's quick edit history. */
function saveMessage<C extends Channel>(
  channel: C,
  value: ChannelMessage[C],
  history: ChannelMessage[C][],
) {
  const edit = commitEdit((campaign) => withMessage(campaign, channel, value));
  return (state: CampaignState) => ({
    ...edit(state),
    quickEditHistory: { ...state.quickEditHistory, [channel]: history },
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
  quickEditHistory: EMPTY_HISTORY,

  // Steve's notes come back fresh, with every reason showing.
  selectPresetCampaign: (presetId) => {
    set({ campaign: buildCampaignFromPreset(presetId, new Date()), quickEditHistory: EMPTY_HISTORY });
    useAgentNotesStore.getState().setNotes(buildAgentNotes(presetId));
  },

  saveSmsMessage: (text) => set(saveMessage("sms", text, [])),

  saveEmailMessage: (email) => set(saveMessage("email", email, [])),

  applyQuickEditResult: (channel, value) => {
    const campaign = get().campaign;
    if (!campaign) return;
    const previous = currentMessage(campaign, channel);
    if (previous !== undefined && sameMessage(previous, value)) return;
    const stack: ChannelMessage[typeof channel][] = get().quickEditHistory[channel];
    set(saveMessage(channel, value, previous === undefined ? stack : [...stack, previous]));
  },

  undoQuickEdit: (channel) => {
    const stack = get().quickEditHistory[channel];
    const previous = stack.at(-1);
    if (!get().campaign || previous === undefined) return;
    set(saveMessage(channel, previous, stack.slice(0, -1)));
  },

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
    set({ campaign: null, quickEditHistory: EMPTY_HISTORY });
    useAgentNotesStore.getState().clearNotes();
  },

  clearSavedSegments: () => set({ savedSegments: [] }),
}));
