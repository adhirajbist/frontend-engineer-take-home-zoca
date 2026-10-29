import Link from "next/link";

/**
 * TEMPORARY guard while the campaign only comes from /dev/campaigns and lives
 * in memory: a reload or a direct visit has none. Never crashes, never scrolls.
 */
export function NoCampaign({ homeLink = false }: { homeLink?: boolean }) {
  return (
    <p>
      No campaign selected. Pick one on /dev/campaigns.
      {homeLink && (
        <>
          {" "}
          <Link href="/" className="font-semibold text-burgundy underline">
            Go to the home page
          </Link>
        </>
      )}
    </p>
  );
}
