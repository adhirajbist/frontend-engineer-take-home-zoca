import { beforeEach, describe, expect, it } from "vitest";
import { PRESET_CAMPAIGNS } from "@/data/presetCampaigns";
import { filtersEqual } from "@/lib/filters";
import { duplicateNameError } from "@/lib/saveFlow";
import type { Filter } from "@/types";
import { useCampaignStore } from "./campaignStore";

const store = useCampaignStore;
const WIN_BACK = PRESET_CAMPAIGNS[0];

const FILTERS: Filter[] = [
  { id: "f1", field: "services", op: "includes", services: ["Balayage"] },
  { id: "f2", field: "totalVisits", op: "moreThan", count: 3 },
];

beforeEach(() => {
  store.getState().resetCampaign();
  store.getState().clearSavedSegments();
});

describe("selectPresetCampaign", () => {
  it("fills every field", () => {
    store.getState().selectPresetCampaign(WIN_BACK.id);
    const campaign = store.getState().campaign;
    expect(campaign).toEqual({
      id: WIN_BACK.id,
      name: WIN_BACK.name,
      channels: WIN_BACK.channels,
      messages: WIN_BACK.messages,
      audience: { type: "segment", segmentId: "lapsed-90" },
      sendTime: { mode: "now" },
    });
  });

  it("replaces the current campaign", () => {
    store.getState().selectPresetCampaign(WIN_BACK.id);
    store.getState().selectPresetCampaign("Holiday gift cards");
    expect(store.getState().campaign?.name).toBe("Holiday gift cards");
  });
});

describe("saving messages", () => {
  beforeEach(() => store.getState().selectPresetCampaign(WIN_BACK.id));

  it("saveSmsMessage changes only the text", () => {
    const before = store.getState().campaign;
    store.getState().saveSmsMessage("New text");
    const after = store.getState().campaign;
    expect(after?.messages.sms).toEqual({ text: "New text" });
    expect(after?.messages.email).toBe(before?.messages.email);
    expect({ ...after, messages: null }).toEqual({ ...before, messages: null });
  });

  it("saveEmailMessage changes only the email", () => {
    const before = store.getState().campaign;
    store.getState().saveEmailMessage({ subject: "Hi", body: "Body" });
    const after = store.getState().campaign;
    expect(after?.messages.email).toEqual({ subject: "Hi", body: "Body" });
    expect(after?.messages.sms).toBe(before?.messages.sms);
    expect({ ...after, messages: null }).toEqual({ ...before, messages: null });
  });

  it("does nothing without a campaign", () => {
    store.getState().resetCampaign();
    store.getState().saveSmsMessage("New text");
    expect(store.getState().campaign).toBeNull();
  });
});

describe("setAudienceSegment", () => {
  it("points the campaign at the segment", () => {
    store.getState().selectPresetCampaign(WIN_BACK.id);
    store.getState().setAudienceSegment("vip");
    expect(store.getState().campaign?.audience).toEqual({ type: "segment", segmentId: "vip" });
  });
});

describe("addSavedSegment", () => {
  it("adds a trimmed name with a new id and does not touch the campaign", () => {
    store.getState().selectPresetCampaign(WIN_BACK.id);
    const campaign = store.getState().campaign;
    const result = store.getState().addSavedSegment("  Balayage regulars ", FILTERS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.segment.id).toMatch(/^saved-./);
    expect(result.segment.name).toBe("Balayage regulars");
    expect(store.getState().savedSegments).toEqual([result.segment]);
    expect(store.getState().campaign).toBe(campaign);
  });

  it("stores a copy of the filters", () => {
    const result = store.getState().addSavedSegment("Balayage regulars", FILTERS);
    if (!result.ok) throw new Error("expected ok");
    const stored = store.getState().savedSegments[0].filters;
    expect(stored).not.toBe(FILTERS);
    stored.forEach((filter, index) => expect(filter).not.toBe(FILTERS[index]));
    expect(filtersEqual(stored, FILTERS)).toBe(true);
  });

  it("gives every segment a different id", () => {
    const a = store.getState().addSavedSegment("One", FILTERS);
    const b = store.getState().addSavedSegment("Two", FILTERS);
    if (!a.ok || !b.ok) throw new Error("expected ok");
    expect(a.segment.id).not.toBe(b.segment.id);
  });

  it.each(["balayage REGULARS", "  Balayage   regulars  ", "VIP", "all clients"])(
    "rejects the duplicate name %j",
    (name) => {
      store.getState().addSavedSegment("Balayage regulars", FILTERS);
      expect(store.getState().addSavedSegment(name, FILTERS)).toEqual({
        ok: false,
        reason: "duplicate-name",
      });
      expect(store.getState().savedSegments).toHaveLength(1);
    },
  );
});

describe("duplicate group names", () => {
  it("returns an error the naming modal can show, and changes nothing", () => {
    store.getState().selectPresetCampaign(WIN_BACK.id);
    const campaign = store.getState().campaign;
    const result = store.getState().addSavedSegment("  Lapsed   90+ DAYS ", FILTERS);
    expect(result).toEqual({ ok: false, reason: "duplicate-name" });
    expect(store.getState().savedSegments).toEqual([]);
    expect(store.getState().campaign).toBe(campaign);
    expect(duplicateNameError("  Lapsed   90+ DAYS ")).toBe(
      "A group called “Lapsed 90+ DAYS” already exists. Try a different name.",
    );
  });
});

describe("resetCampaign", () => {
  it("clears the campaign and keeps saved segments", () => {
    store.getState().selectPresetCampaign(WIN_BACK.id);
    store.getState().addSavedSegment("Balayage regulars", FILTERS);
    store.getState().resetCampaign();
    expect(store.getState().campaign).toBeNull();
    expect(store.getState().savedSegments).toHaveLength(1);
  });
});
