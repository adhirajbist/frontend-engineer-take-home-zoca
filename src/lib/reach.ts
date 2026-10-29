import type { Channel, Client, Segment } from "@/types";
import { canEmail, canReach, canText, filterClients } from "./filters";

export type AudienceStats = {
  /** Clients in the group. */
  matching: number;
  /** Of those, clients who can get a text. */
  texted: number;
  /** Of those, clients who can get an email. */
  mailed: number;
};

export function getAudienceStats(segment: Segment, clients: Client[], today: Date): AudienceStats {
  const matching = filterClients(clients, segment.filters, today);
  return {
    matching: matching.length,
    texted: matching.filter(canText).length,
    mailed: matching.filter(canEmail).length,
  };
}

/** Clients reachable by at least one of the channels. Each counts once. */
export function countReachable(clients: Client[], channels: readonly Channel[]): number {
  return clients.filter((client) => channels.some((channel) => canReach(client, channel))).length;
}
