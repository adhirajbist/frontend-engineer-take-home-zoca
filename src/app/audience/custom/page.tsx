"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { CustomGroupBuilder } from "@/components/custom-group/CustomGroupBuilder";
import { NoCampaign } from "@/components/NoCampaign";
import { AUDIENCE_CARD } from "@/lib/editorRoutes";
import { duplicateNameError } from "@/lib/saveFlow";
import { findSegment } from "@/lib/segments";
import { useCampaignStore } from "@/store/campaignStore";
import type { Filter } from "@/types";

export default function CustomAudiencePage() {
  const router = useRouter();
  // Changes on every new visit, so each visit starts from the campaign's group.
  const { bfcacheId } = useRouter();
  const { channels, segmentId } = useCampaignStore(
    useShallow((state) => ({
      channels: state.campaign?.channels,
      segmentId:
        state.campaign?.audience?.type === "segment" ? state.campaign.audience.segmentId : null,
    })),
  );
  const savedSegments = useCampaignStore((state) => state.savedSegments);
  const { setAudienceSegment, addSavedSegment } = useCampaignStore(
    useShallow((state) => ({
      setAudienceSegment: state.setAudienceSegment,
      addSavedSegment: state.addSavedSegment,
    })),
  );
  const group = useMemo(
    () => (segmentId ? findSegment(segmentId, savedSegments) : undefined),
    [segmentId, savedSegments],
  );

  function applyGroup(id: string) {
    setAudienceSegment(id);
    router.push(AUDIENCE_CARD, { scroll: false });
  }

  function saveAs(name: string, filters: Filter[]): string | null {
    const result = addSavedSegment(name, filters);
    if (!result.ok) return duplicateNameError(name);
    applyGroup(result.segment.id);
    return null;
  }

  return (
    // The document never scrolls (see globals.css), so this page scrolls itself.
    <main className="focus-burgundy h-(--screen) overflow-y-auto">
      <div className="mx-auto max-w-300 px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
        {channels && group ? (
          <>
            <Link
              href={AUDIENCE_CARD}
              scroll={false}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-burgundy hover:underline"
            >
              <ArrowLeft aria-hidden="true" className="size-5" />
              Back to campaign
            </Link>
            <CustomGroupBuilder
              key={bfcacheId}
              channels={channels}
              initialGroup={group}
              savedSegments={savedSegments}
              onUseGroup={applyGroup}
              onSaveAs={saveAs}
            />
          </>
        ) : (
          <NoCampaign homeLink />
        )}
      </div>
    </main>
  );
}
