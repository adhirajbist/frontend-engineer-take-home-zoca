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
import { buildCampaignFromPreset } from "@/data/presetCampaigns";
import { cloneFilters, newFilterId } from "@/lib/filters";
import { isNameTaken } from "@/lib/segments";
import type { Campaign, EmailMessage, Filter, Segment } from "@/types";

export type AddSegmentResult =
  | { ok: true; segment: Segment }
  | { ok: false; reason: "duplicate-name" };

type CampaignState = {
  campaign: Campaign | null;
  savedSegments: Segment[];
  selectPresetCampaign: (presetId: string) => void;
  saveSmsMessage: (text: string) => void;
  saveEmailMessage: (email: EmailMessage) => void;
  setAudienceSegment: (segmentId: string) => void;
  /** Adds a saved group. Does not change the campaign's audience. */
  addSavedSegment: (name: string, filters: readonly Filter[]) => AddSegmentResult;
  /** Clears the campaign. Saved groups stay. */
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

export const useCampaignStore = create<CampaignState>()((set, get) => ({
  campaign: null,
  savedSegments: [],

  selectPresetCampaign: (presetId) =>
    set({ campaign: buildCampaignFromPreset(presetId, new Date()) }),

  saveSmsMessage: (text) =>
    set(
      updateCampaign((campaign) => ({
        ...campaign,
        messages: { ...campaign.messages, sms: { text } },
      })),
    ),

  saveEmailMessage: ({ subject, body }) =>
    set(
      updateCampaign((campaign) => ({
        ...campaign,
        messages: { ...campaign.messages, email: { subject, body } },
      })),
    ),

  setAudienceSegment: (segmentId) =>
    set(updateCampaign((campaign) => ({ ...campaign, audience: { type: "segment", segmentId } }))),

  addSavedSegment: (name, filters) => {
    const trimmed = name.trim();
    if (isNameTaken(trimmed, get().savedSegments)) return { ok: false, reason: "duplicate-name" };
    const segment: Segment = { id: newSegmentId(), name: trimmed, filters: cloneFilters(filters) };
    set((state) => ({ savedSegments: [...state.savedSegments, segment] }));
    return { ok: true, segment };
  },

  resetCampaign: () => set({ campaign: null }),

  clearSavedSegments: () => set({ savedSegments: [] }),
}));
