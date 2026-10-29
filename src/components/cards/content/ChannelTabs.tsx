import { SegmentedTabs } from "@/components/SegmentedTabs";
import type { Channel } from "@/types";

const TAB_LABELS: Record<Channel, string> = { sms: "Text", email: "Email" };

/**
 * Segmented switch between the text and email previews. Must sit inside
 * Tabs.Root. Sits on its own line under the title, right-aligned.
 */
type ChannelTabsProps = { channels: readonly Channel[]; disabled?: boolean };

export function ChannelTabs({ channels, disabled }: ChannelTabsProps) {
  return (
    <SegmentedTabs
      label="Which message to show"
      options={channels.map((channel) => ({ value: channel, label: TAB_LABELS[channel] }))}
      className="ml-auto"
      disabled={disabled}
    />
  );
}
