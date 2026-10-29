"use client";

import { ArrowRight } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { SECONDARY_BUTTON } from "@/components/custom-group/buttonStyles";
import { continueLabel } from "@/lib/continueLabel";
import { useCampaignStore } from "@/store/campaignStore";
import type { Campaign } from "@/types";

type ContinueCampaignProps = {
  disabled: boolean;
  onContinue: () => void;
};

/**
 * Back to the campaign the owner had when they came to this page, untouched.
 * A campaign made here (by Steve or a preset) never shows it: that is the
 * normal way forward, and it has its own button.
 */
export function ContinueCampaign({ disabled, onContinue }: ContinueCampaignProps) {
  const [onArrival, setOnArrival] = useState<Campaign | null>(null);
  // Runs on every visit: Next keeps this page alive and re-runs layout
  // effects when it shows it again. Before paint, so it never flashes.
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the store once per visit
    setOnArrival(useCampaignStore.getState().campaign);
  }, []);
  // A plain boolean, so other campaign changes don't re-render it.
  const replaced = useCampaignStore((state) => state.campaign !== onArrival);
  if (!onArrival) return null;

  const label = continueLabel(onArrival.name, onArrival.status);

  return (
    // Replaced on this visit: hidden but keeps its space, so the list below
    // doesn't jump while a picked preset opens.
    <button
      type="button"
      disabled={disabled || replaced}
      onClick={onContinue}
      aria-hidden={replaced || undefined}
      aria-label={label.status ? `${label.text}, ${label.status}` : label.text}
      className={`${SECONDARY_BUTTON} flex w-full items-center gap-3 disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-white ${replaced ? "invisible" : ""}`}
    >
      {/* The visible name may be cut short; the accessible name has all of it. */}
      <span className="min-w-0 flex-1 truncate text-left">{label.text}</span>
      {label.status && <span className="shrink-0 text-sm font-normal text-muted">{label.status}</span>}
      <ArrowRight aria-hidden="true" className="size-5 shrink-0" />
    </button>
  );
}
