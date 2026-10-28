"use client";

import { useRouter } from "next/navigation";
import { AudienceCard, DUMMY_AUDIENCE } from "@/components/cards/AudienceCard";

/** Client wrapper so the server page can give AudienceCard a navigation handler. */
export function AudienceStep() {
  const router = useRouter();
  return <AudienceCard {...DUMMY_AUDIENCE} onEdit={() => router.push("/audience/custom")} />;
}
