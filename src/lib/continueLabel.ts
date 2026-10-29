import type { CampaignStatus } from "@/types";

export type ContinueLabel = {
  /** The button text, e.g. "Continue: Spring refresh". */
  text: string;
  /** Muted text after it, or null for a draft. */
  status: string | null;
};

const STATUS_TEXT: Record<CampaignStatus, string | null> = {
  draft: null,
  scheduled: "Scheduled",
  sent: "Launched",
};

/** The landing page's "Continue" button for the campaign in progress. */
export function continueLabel(name: string, status: CampaignStatus): ContinueLabel {
  return { text: `Continue: ${name}`, status: STATUS_TEXT[status] };
}
