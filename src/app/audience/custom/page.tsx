"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CustomGroupBuilder,
  type SavedGroup,
} from "@/components/custom-group/CustomGroupBuilder";
import type { Channel } from "@/types";

/** DUMMY DATA: the campaign's selected channels. Replace with campaign state. */
const CAMPAIGN_CHANNELS: Channel[] = ["sms", "email"];

/** CardStack reads the hash and jumps straight to the Audience card. */
const AUDIENCE_CARD = "/#step-4";

function saveGroup(group: SavedGroup) {
  // TODO: save the group to the store so the Audience card shows it.
  void group;
}

export default function CustomAudiencePage() {
  const router = useRouter();

  function handleDone(group: SavedGroup) {
    saveGroup(group);
    router.push(AUDIENCE_CARD, { scroll: false });
  }

  return (
    // The document never scrolls (see globals.css), so this page scrolls itself.
    <main className="focus-burgundy h-(--screen) overflow-y-auto">
      <div className="mx-auto max-w-300 px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
        <Link
          href={AUDIENCE_CARD}
          scroll={false}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-burgundy hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
          Back to campaign
        </Link>
        <CustomGroupBuilder channels={CAMPAIGN_CHANNELS} onDone={handleDone} />
      </div>
    </main>
  );
}
