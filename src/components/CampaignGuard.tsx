"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useCampaignStore } from "@/store/campaignStore";

/**
 * The campaign lives in memory, so a reload or a direct visit has none: send
 * the owner to the landing page. Renders nothing until there is a campaign,
 * so a broken page never flashes. Checks once, on mount; "Start a new
 * campaign" navigates away itself.
 */
export function CampaignGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hasCampaign = useCampaignStore((state) => state.campaign !== null);

  useEffect(() => {
    if (!useCampaignStore.getState().campaign) router.replace("/");
  }, [router]);

  return hasCampaign ? children : null;
}
