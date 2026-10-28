"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CustomGroupBuilder } from "@/components/custom-group/CustomGroupBuilder";

export default function CustomAudiencePage() {
  return (
    // The document never scrolls (see globals.css), so this page scrolls itself.
    <main className="focus-burgundy h-(--screen) overflow-y-auto">
      <div className="mx-auto max-w-300 px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
        {/* CardStack reads the hash and jumps straight to the Audience card. */}
        <Link
          href="/#step-4"
          scroll={false}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-burgundy hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
          Back to campaign
        </Link>
        <CustomGroupBuilder />
      </div>
    </main>
  );
}
