import { formatNeedsDetailMessage, type SteveReply } from "@/ai/steve";

/** request counts sends, so a reply to an older send can be spotted and dropped. */
export type SteveFlow =
  | { phase: "idle"; request: number }
  | { phase: "thinking"; request: number }
  | { phase: "ready"; request: number; presetId: string }
  | { phase: "needs-detail"; request: number; message: string };

export type SteveEvent =
  | { type: "send" }
  | { type: "reply"; request: number; reply: SteveReply };

export const INITIAL_STEVE_FLOW: SteveFlow = { phase: "idle", request: 0 };

export const IDLE_MESSAGE = "Hi! I'm Steve. I help you build your campaigns!";
export const READY_MESSAGE = "Our campaign is ready!";
export const TYPING_MESSAGE = "Steve is typing";

export function steveFlowReducer(flow: SteveFlow, event: SteveEvent): SteveFlow {
  switch (event.type) {
    case "send":
      // A new request replaces whatever was showing.
      return { phase: "thinking", request: flow.request + 1 };
    case "reply":
      if (flow.phase !== "thinking" || event.request !== flow.request) return flow;
      return event.reply.kind === "ready"
        ? { phase: "ready", request: flow.request, presetId: event.reply.presetId }
        : {
            phase: "needs-detail",
            request: flow.request,
            message: formatNeedsDetailMessage(event.reply.missing),
          };
  }
}

/** While Steve thinks, the input, the send button and the list are disabled. */
export function isBusy(flow: SteveFlow): boolean {
  return flow.phase === "thinking";
}

/** What the status region says. Empty on idle, so nothing is read on page load. */
export function getAnnouncement(flow: SteveFlow): string {
  switch (flow.phase) {
    case "idle":
      return "";
    case "thinking":
      return TYPING_MESSAGE;
    case "ready":
      return READY_MESSAGE;
    case "needs-detail":
      return flow.message;
  }
}
