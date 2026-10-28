import { CardStack } from "@/components/CardStack";
import { AudienceStep } from "@/components/cards/AudienceStep";
import { CampaignNameCard } from "@/components/cards/CampaignNameCard";
import { ChannelCard } from "@/components/cards/ChannelCard";
import { ContentCard } from "@/components/cards/ContentCard";
import { CAMPAIGN_CHANNELS, DUMMY_CONTENT } from "@/components/cards/content/dummyContent";
import { LaunchCard } from "@/components/cards/LaunchCard";
import { SendTimeCard } from "@/components/cards/SendTimeCard";

export default function Home() {
  return (
    <CardStack count={6}>
      <h1 className="sr-only">New campaign</h1>
      <CampaignNameCard />
      <ChannelCard />
      <ContentCard channels={CAMPAIGN_CHANNELS} {...DUMMY_CONTENT} />
      <AudienceStep />
      <SendTimeCard />
      <LaunchCard />
    </CardStack>
  );
}
