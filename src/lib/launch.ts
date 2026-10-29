/** Can the campaign be launched right now? Pure: callers pass `now`. */
import type { AudienceStats } from "@/lib/reach";
import type { Campaign } from "@/types";

export type LaunchBlockReason = "no-text-reach" | "no-email-reach" | "no-reach" | "time-passed";

export type LaunchCheck = { ok: true } | { ok: false; reason: LaunchBlockReason };

/**
 * A selected channel nobody in the group can get blocks the launch. Channels
 * that are not selected never do. A scheduled time must still be ahead of
 * `now` (the 5-minute lead only applies when picking it).
 */
export function getLaunchCheck(
  campaign: Pick<Campaign, "channels" | "sendTime">,
  stats: Pick<AudienceStats, "texted" | "mailed">,
  now: Date,
): LaunchCheck {
  const noText = campaign.channels.includes("sms") && stats.texted === 0;
  const noEmail = campaign.channels.includes("email") && stats.mailed === 0;
  if (noText && noEmail) return { ok: false, reason: "no-reach" };
  if (noText) return { ok: false, reason: "no-text-reach" };
  if (noEmail) return { ok: false, reason: "no-email-reach" };

  const { sendTime } = campaign;
  if (sendTime?.mode === "scheduled" && new Date(sendTime.iso).getTime() <= now.getTime()) {
    return { ok: false, reason: "time-passed" };
  }
  return { ok: true };
}

const EDIT_HINT = "Please edit the group or the channel before launching.";

const MESSAGES: Record<LaunchBlockReason, string> = {
  "no-text-reach": `None of the clients in this group can get a text. ${EDIT_HINT}`,
  "no-email-reach": `None of the clients in this group can get an email. ${EDIT_HINT}`,
  "no-reach": `None of the clients in this group can get a text or an email. ${EDIT_HINT}`,
  "time-passed": "The time you picked has already passed. Please pick a new send time.",
};

/** What Steve says when the launch is blocked. */
export function getLaunchMessage(reason: LaunchBlockReason): string {
  return MESSAGES[reason];
}
