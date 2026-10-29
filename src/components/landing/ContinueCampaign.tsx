"use client";

import { ArrowRight } from "lucide-react";
import { SECONDARY_BUTTON } from "@/components/custom-group/buttonStyles";
import { continueLabel } from "@/lib/continueLabel";
import { useCampaignStore } from "@/store/campaignStore";

type ContinueCampaignProps = {
  disabled: boolean;
  onContinue: () => void;
};

/**
 * Back to the campaign in progress, untouched. Nothing when there is none.
 * Two plain-value selectors, so other campaign changes don't re-render it.
 */
export function ContinueCampaign({ disabled, onContinue }: ContinueCampaignProps) {
  const name = useCampaignStore((state) => state.campaign?.name);
  const status = useCampaignStore((state) => state.campaign?.status);
  if (name === undefined || status === undefined) return null;

  const label = continueLabel(name, status);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onContinue}
      aria-label={label.status ? `${label.text}, ${label.status}` : label.text}
      className={`${SECONDARY_BUTTON} flex w-full items-center gap-3 disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-white`}
    >
      {/* The visible name may be cut short; the accessible name has all of it. */}
      <span className="min-w-0 flex-1 truncate text-left">{label.text}</span>
      {label.status && <span className="shrink-0 text-sm font-normal text-muted">{label.status}</span>}
      <ArrowRight aria-hidden="true" className="size-5 shrink-0" />
    </button>
  );
}
