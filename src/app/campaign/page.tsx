import { CampaignGuard } from "@/components/CampaignGuard";
import { CampaignTopBar } from "@/components/campaign/CampaignTopBar";
import { CardStack } from "@/components/CardStack";
import { TOTAL_STEPS } from "@/components/StackCard";
import { AudienceStep } from "@/components/cards/AudienceStep";
import { CampaignNameCard } from "@/components/cards/CampaignNameCard";
import { ChannelCard } from "@/components/cards/ChannelCard";
import { ContentCard } from "@/components/cards/ContentCard";
import { LaunchCard } from "@/components/cards/LaunchCard";
import { SendTimeCard } from "@/components/cards/SendTimeCard";

export default function CampaignPage() {
  return (
    <CampaignGuard>
      <CampaignTopBar />
      <CardStack count={TOTAL_STEPS}>
        <h1 className="sr-only">New campaign</h1>
        <CampaignNameCard />
        <ChannelCard />
        <ContentCard />
        <AudienceStep />
        <SendTimeCard />
        <LaunchCard />
      </CardStack>
    </CampaignGuard>
  );
}
