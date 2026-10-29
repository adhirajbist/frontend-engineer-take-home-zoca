import Link from "next/link";

/**
 * The campaign lives in memory, so a reload or a direct visit has none.
 * Never crashes, never scrolls; points the owner back to the landing page.
 */
export function NoCampaign() {
  return (
    <p>
      No campaign selected.{" "}
      <Link href="/" className="font-semibold text-burgundy underline">
        Start here
      </Link>
    </p>
  );
}
