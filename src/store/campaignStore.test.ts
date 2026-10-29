import { beforeEach, describe, expect, it } from "vitest";
import { buildAgentNotes, PRESET_CAMPAIGNS } from "@/data/presetCampaigns";
import { filtersEqual } from "@/lib/filters";
import { duplicateNameError } from "@/lib/saveFlow";
import type { Filter } from "@/types";
import { selectCardNote, useAgentNotesStore } from "./agentNotesStore";
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
      status: "draft",
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

describe("setCampaignName", () => {
  beforeEach(() => store.getState().selectPresetCampaign(WIN_BACK.id));

  it("saves the trimmed name", () => {
    expect(store.getState().setCampaignName("  Spring refresh  ")).toEqual({ ok: true });
    expect(store.getState().campaign?.name).toBe("Spring refresh");
  });

  it.each(["", "   ", "\n\t"])("rejects the empty name %j", (name) => {
    expect(store.getState().setCampaignName(name)).toEqual({ ok: false, reason: "empty" });
    expect(store.getState().campaign?.name).toBe(WIN_BACK.name);
  });

  it("accepts 50 characters and rejects 51", () => {
    const fifty = "W".repeat(50);
    expect(store.getState().setCampaignName(` ${fifty} `)).toEqual({ ok: true });
    expect(store.getState().campaign?.name).toBe(fifty);
    expect(store.getState().setCampaignName(`${fifty}W`)).toEqual({
      ok: false,
      reason: "too-long",
    });
    expect(store.getState().campaign?.name).toBe(fifty);
  });

  it("says why without a campaign", () => {
    store.getState().resetCampaign();
    expect(store.getState().setCampaignName("Hi")).toEqual({ ok: false, reason: "no-campaign" });
  });
});

describe("setChannels", () => {
  beforeEach(() => store.getState().selectPresetCampaign(WIN_BACK.id));

  it("sorts the channels as text then email and keeps both messages", () => {
    const messages = store.getState().campaign?.messages;
    store.getState().setChannels(["email"]);
    expect(store.getState().setChannels(["email", "sms", "email"])).toEqual({ ok: true });
    expect(store.getState().campaign?.channels).toEqual(["sms", "email"]);
    expect(store.getState().campaign?.messages).toBe(messages);
  });

  it("rejects an empty list", () => {
    expect(store.getState().setChannels([])).toEqual({ ok: false, reason: "empty" });
    expect(store.getState().campaign?.channels).toEqual(["sms", "email"]);
  });

  it("says why without a campaign", () => {
    store.getState().resetCampaign();
    expect(store.getState().setChannels(["sms"])).toEqual({ ok: false, reason: "no-campaign" });
  });
});

describe("setSendTime", () => {
  beforeEach(() => store.getState().selectPresetCampaign(WIN_BACK.id));

  it("schedules and goes back to now", () => {
    const iso = "2026-11-03T16:00:00.000Z";
    expect(store.getState().setSendTime({ mode: "scheduled", iso })).toEqual({ ok: true });
    expect(store.getState().campaign?.sendTime).toEqual({ mode: "scheduled", iso });
    store.getState().setSendTime({ mode: "now" });
    expect(store.getState().campaign?.sendTime).toEqual({ mode: "now" });
  });

  it("says why without a campaign", () => {
    store.getState().resetCampaign();
    expect(store.getState().setSendTime({ mode: "now" })).toEqual({
      ok: false,
      reason: "no-campaign",
    });
  });
});

describe("Steve's reasons", () => {
  beforeEach(() => store.getState().selectPresetCampaign(WIN_BACK.id));
  const reason = (card: "channel" | "audience" | "time") =>
    selectCardNote(useAgentNotesStore.getState(), card)?.reason;

  it("are filled in when a preset is selected", () => {
    expect(useAgentNotesStore.getState().notes).toEqual(buildAgentNotes(WIN_BACK.id));
    expect(reason("channel")).toBe(WIN_BACK.channelReason);
    expect(reason("audience")).toBe(WIN_BACK.audienceReason);
    expect(reason("time")).toBe(WIN_BACK.timeReason);
  });

  it("hides the channel reason for good once the channels change", () => {
    store.getState().setChannels(["sms"]);
    expect(reason("channel")).toBeUndefined();
    expect(reason("audience")).toBe(WIN_BACK.audienceReason);
    // Picking the original channels again does not bring it back.
    store.getState().setChannels(["sms", "email"]);
    expect(reason("channel")).toBeUndefined();
  });

  it("keeps the channel reason when the channels are the same", () => {
    const campaign = store.getState().campaign;
    store.getState().setChannels(["email", "sms"]);
    expect(store.getState().campaign).toBe(campaign);
    expect(reason("channel")).toBe(WIN_BACK.channelReason);
  });

  it("hides the group reason once the group changes", () => {
    store.getState().setAudienceSegment("vip");
    expect(reason("audience")).toBeUndefined();
    expect(reason("channel")).toBe(WIN_BACK.channelReason);
  });

  it("keeps the group reason when the group is the same", () => {
    const campaign = store.getState().campaign;
    store.getState().setAudienceSegment("lapsed-90");
    expect(store.getState().campaign).toBe(campaign);
    expect(reason("audience")).toBe(WIN_BACK.audienceReason);
  });

  it("hides the send time reason once the mode or the time changes", () => {
    store.getState().setSendTime({ mode: "scheduled", iso: "2026-11-03T16:00:00.000Z" });
    expect(reason("time")).toBeUndefined();
  });

  it("keeps the send time reason when the send time is the same", () => {
    store.getState().setSendTime({ mode: "now" });
    expect(reason("time")).toBe(WIN_BACK.timeReason);
  });

  it("treats a different scheduled time as a change, and the same one as none", () => {
    const iso = "2026-11-03T16:00:00.000Z";
    store.getState().setSendTime({ mode: "scheduled", iso });
    // Bring the reason back while the campaign stays scheduled.
    useAgentNotesStore.getState().setNotes(buildAgentNotes(WIN_BACK.id));
    store.getState().setSendTime({ mode: "scheduled", iso });
    expect(reason("time")).toBe(WIN_BACK.timeReason);
    store.getState().setSendTime({ mode: "scheduled", iso: "2026-11-04T16:00:00.000Z" });
    expect(reason("time")).toBeUndefined();
  });

  it("come back when a preset is selected again", () => {
    store.getState().setChannels(["sms"]);
    store.getState().setAudienceSegment("vip");
    store.getState().setSendTime({ mode: "scheduled", iso: "2026-11-03T16:00:00.000Z" });
    store.getState().selectPresetCampaign(WIN_BACK.id);
    expect(reason("channel")).toBe(WIN_BACK.channelReason);
    expect(reason("audience")).toBe(WIN_BACK.audienceReason);
    expect(reason("time")).toBe(WIN_BACK.timeReason);
  });

  it("keep the neutral line after the reason is hidden", () => {
    store.getState().setChannels(["sms"]);
    expect(selectCardNote(useAgentNotesStore.getState(), "channel")).toEqual({
      neutral: buildAgentNotes(WIN_BACK.id).channel.neutral,
    });
  });
});

describe("editing a launched campaign", () => {
  const ISO = "2026-11-03T16:00:00.000Z";

  beforeEach(() => {
    store.getState().selectPresetCampaign(WIN_BACK.id);
    store.getState().setSendTime({ mode: "scheduled", iso: ISO });
    store.getState().launchCampaign(new Date("2026-10-29T15:00:00.000Z"));
    expect(store.getState().campaign?.status).toBe("scheduled");
  });

  it.each([
    ["setCampaignName", () => store.getState().setCampaignName("Spring refresh")],
    ["setChannels", () => store.getState().setChannels(["email"])],
    ["saveSmsMessage", () => store.getState().saveSmsMessage("New text")],
    ["saveEmailMessage", () => store.getState().saveEmailMessage({ subject: "Hi", body: "Body" })],
    ["setAudienceSegment", () => store.getState().setAudienceSegment("vip")],
    ["setSendTime", () => store.getState().setSendTime({ mode: "now" })],
  ])("%s makes it a draft again", (_, edit) => {
    edit();
    const campaign = store.getState().campaign;
    expect(campaign?.status).toBe("draft");
    expect(campaign && "launchedAt" in campaign).toBe(false);
  });
});

describe("quick edits", () => {
  const SHORT = "Short text";
  const SHORT_EMAIL = { subject: "Short", body: "Short body" };

  beforeEach(() => store.getState().selectPresetCampaign(WIN_BACK.id));

  const history = () => store.getState().quickEditHistory;
  const messages = () => store.getState().campaign?.messages;

  it("save the new message and remember the previous one", () => {
    store.getState().applyQuickEditResult("sms", SHORT);
    expect(messages()?.sms).toEqual({ text: SHORT });
    expect(history().sms).toEqual([WIN_BACK.messages.sms?.text]);
  });

  it("undo one step at a time back to the exact previous value", () => {
    store.getState().applyQuickEditResult("email", SHORT_EMAIL);
    store.getState().applyQuickEditResult("email", { subject: "Second", body: "Second body" });
    store.getState().undoQuickEdit("email");
    expect(messages()?.email).toEqual(SHORT_EMAIL);
    store.getState().undoQuickEdit("email");
    expect(messages()?.email).toEqual(WIN_BACK.messages.email);
    expect(history().email).toEqual([]);
    store.getState().undoQuickEdit("email");
    expect(messages()?.email).toEqual(WIN_BACK.messages.email);
  });

  it("keep a separate history per channel", () => {
    store.getState().applyQuickEditResult("sms", SHORT);
    store.getState().applyQuickEditResult("email", SHORT_EMAIL);
    store.getState().undoQuickEdit("sms");
    expect(messages()?.sms).toEqual(WIN_BACK.messages.sms);
    expect(messages()?.email).toEqual(SHORT_EMAIL);
    expect(history()).toEqual({ sms: [], email: [WIN_BACK.messages.email] });
  });

  it("add nothing when the result is identical", () => {
    const before = store.getState().campaign;
    store.getState().applyQuickEditResult("sms", WIN_BACK.messages.sms?.text ?? "");
    store.getState().applyQuickEditResult("email", { ...WIN_BACK.messages.email! });
    expect(store.getState().campaign).toBe(before);
    expect(history()).toEqual({ sms: [], email: [] });
  });

  it("are forgotten for that channel when the editor saves", () => {
    store.getState().applyQuickEditResult("sms", SHORT);
    store.getState().applyQuickEditResult("email", SHORT_EMAIL);
    store.getState().saveSmsMessage("Written by the owner");
    expect(history()).toEqual({ sms: [], email: [WIN_BACK.messages.email] });
    store.getState().saveEmailMessage({ subject: "Owner", body: "Owner body" });
    expect(history().email).toEqual([]);
    store.getState().undoQuickEdit("sms");
    expect(messages()?.sms).toEqual({ text: "Written by the owner" });
  });

  it("are all forgotten when a preset is selected or the campaign is reset", () => {
    store.getState().applyQuickEditResult("sms", SHORT);
    store.getState().applyQuickEditResult("email", SHORT_EMAIL);
    store.getState().selectPresetCampaign(WIN_BACK.id);
    expect(history()).toEqual({ sms: [], email: [] });
    store.getState().applyQuickEditResult("sms", SHORT);
    store.getState().resetCampaign();
    expect(history()).toEqual({ sms: [], email: [] });
  });

  it("make a launched campaign a draft again, and so does undo", () => {
    store.getState().launchCampaign(new Date("2026-10-29T15:00:00.000Z"));
    store.getState().applyQuickEditResult("sms", SHORT);
    expect(store.getState().campaign?.status).toBe("draft");
    store.getState().launchCampaign(new Date("2026-10-29T15:00:00.000Z"));
    store.getState().undoQuickEdit("sms");
    expect(store.getState().campaign?.status).toBe("draft");
  });
});

describe("launchCampaign", () => {
  const NOW = new Date("2026-10-29T15:00:00.000Z");
  const ISO = "2026-11-03T16:00:00.000Z";

  beforeEach(() => store.getState().selectPresetCampaign(WIN_BACK.id));

  it("sends right away when the send time is now", () => {
    store.getState().launchCampaign(NOW);
    const campaign = store.getState().campaign;
    expect(campaign?.status).toBe("sent");
    expect(campaign?.launchedAt).toBe(NOW.toISOString());
  });

  it("schedules when a time is picked", () => {
    store.getState().setSendTime({ mode: "scheduled", iso: ISO });
    store.getState().launchCampaign(NOW);
    const campaign = store.getState().campaign;
    expect(campaign?.status).toBe("scheduled");
    expect(campaign?.launchedAt).toBe(NOW.toISOString());
  });

  it("changes nothing else", () => {
    const before = store.getState().campaign;
    store.getState().launchCampaign(NOW);
    const after = store.getState().campaign;
    expect({ ...after, status: null, launchedAt: null }).toEqual({
      ...before,
      status: null,
      launchedAt: null,
    });
  });

  it("does nothing without a campaign", () => {
    store.getState().resetCampaign();
    store.getState().launchCampaign(NOW);
    expect(store.getState().campaign).toBeNull();
  });
});

describe("cancelSchedule", () => {
  const NOW = new Date("2026-10-29T15:00:00.000Z");

  beforeEach(() => store.getState().selectPresetCampaign(WIN_BACK.id));

  it("makes a scheduled campaign a draft and keeps the send time", () => {
    const sendTime = { mode: "scheduled", iso: "2026-11-03T16:00:00.000Z" } as const;
    store.getState().setSendTime(sendTime);
    store.getState().launchCampaign(NOW);
    store.getState().cancelSchedule();
    const campaign = store.getState().campaign;
    expect(campaign?.status).toBe("draft");
    expect(campaign && "launchedAt" in campaign).toBe(false);
    expect(campaign?.sendTime).toEqual(sendTime);
  });

  it("leaves a sent campaign alone", () => {
    store.getState().launchCampaign(NOW);
    const before = store.getState().campaign;
    store.getState().cancelSchedule();
    expect(store.getState().campaign).toBe(before);
  });

  it("leaves a draft alone", () => {
    const before = store.getState().campaign;
    store.getState().cancelSchedule();
    expect(store.getState().campaign).toBe(before);
  });

  it("does nothing without a campaign", () => {
    store.getState().resetCampaign();
    store.getState().cancelSchedule();
    expect(store.getState().campaign).toBeNull();
  });
});

describe("a sent campaign that is edited", () => {
  it("becomes a draft and can be launched again", () => {
    store.getState().selectPresetCampaign(WIN_BACK.id);
    store.getState().launchCampaign(new Date("2026-10-29T15:00:00.000Z"));
    store.getState().setChannels(["sms"]);
    expect(store.getState().campaign?.status).toBe("draft");
    store.getState().launchCampaign(new Date("2026-10-29T16:00:00.000Z"));
    expect(store.getState().campaign?.status).toBe("sent");
    expect(store.getState().campaign?.launchedAt).toBe("2026-10-29T16:00:00.000Z");
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
  it("clears Steve's notes", () => {
    store.getState().selectPresetCampaign(WIN_BACK.id);
    store.getState().resetCampaign();
    expect(useAgentNotesStore.getState().notes).toBeNull();
    expect(selectCardNote(useAgentNotesStore.getState(), "name")).toBeNull();
  });

  it("clears the campaign and keeps saved segments", () => {
    store.getState().selectPresetCampaign(WIN_BACK.id);
    store.getState().addSavedSegment("Balayage regulars", FILTERS);
    store.getState().resetCampaign();
    expect(store.getState().campaign).toBeNull();
    expect(store.getState().savedSegments).toHaveLength(1);
  });
});
