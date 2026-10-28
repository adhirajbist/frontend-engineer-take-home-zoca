import { CardStack } from "@/components/CardStack";
import { AudienceStep } from "@/components/cards/AudienceStep";
import { CampaignNameCard } from "@/components/cards/CampaignNameCard";
import { ChannelCard } from "@/components/cards/ChannelCard";
import { ContentCard } from "@/components/cards/ContentCard";
import { CAMPAIGN_CHANNELS } from "@/components/cards/content/dummyContent";
import { LaunchCard } from "@/components/cards/LaunchCard";
import { SendTimeCard } from "@/components/cards/SendTimeCard";
import { DUMMY_MESSAGES } from "@/data/dummyMessages";

export default function Home() {
  return (
    <CardStack count={6}>
      <h1 className="sr-only">New campaign</h1>
      <CampaignNameCard />
      <ChannelCard />
      <ContentCard
        channels={CAMPAIGN_CHANNELS}
        smsMessage={DUMMY_MESSAGES.sms}
        emailSubject={DUMMY_MESSAGES.emailSubject}
        emailBody={DUMMY_MESSAGES.emailBody}
      />
      <AudienceStep />
      <SendTimeCard />
      <LaunchCard />
    </CardStack>
  );
}
