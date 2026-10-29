import { notFound } from "next/navigation";
import { DevCampaigns } from "./DevCampaigns";

/** TEMPORARY: a page for checking the campaign store by hand. Never ships. */
export default function DevCampaignsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevCampaigns />;
}
