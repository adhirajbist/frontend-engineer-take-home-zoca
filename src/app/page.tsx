import { CardStack } from "@/components/CardStack";
import { AudienceCard } from "@/components/cards/AudienceCard";
import { CampaignNameCard } from "@/components/cards/CampaignNameCard";
import { ChannelCard } from "@/components/cards/ChannelCard";
import { ContentCard } from "@/components/cards/ContentCard";
import { LaunchCard } from "@/components/cards/LaunchCard";
import { SendTimeCard } from "@/components/cards/SendTimeCard";

export default function Home() {
  return (
    <CardStack count={6}>
      <h1 className="sr-only">New campaign</h1>
      <CampaignNameCard />
      <ChannelCard />
      <ContentCard />
      <AudienceCard />
      <SendTimeCard />
      <LaunchCard />
    </CardStack>
  );
}
