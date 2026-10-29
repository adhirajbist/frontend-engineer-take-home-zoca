import { Megaphone } from "lucide-react";
import { PRESET_CAMPAIGNS } from "@/data/presetCampaigns";

type CampaignListProps = {
  disabled: boolean;
  onPick: (presetId: string) => void;
};

/** Ready-made campaigns. Picking one opens it straight away. */
export function CampaignList({ disabled, onPick }: CampaignListProps) {
  return (
    <section
      aria-labelledby="campaigns-heading"
      className="overflow-hidden rounded-2xl border border-ink/15 bg-white shadow-sm shadow-ink/5"
    >
      <h2
        id="campaigns-heading"
        className="flex items-center gap-2 border-b border-ink/10 px-4 py-3 text-sm font-bold"
      >
        <Megaphone aria-hidden="true" className="size-4 text-plum" />
        Campaigns
      </h2>
      <ul className="divide-y divide-ink/10">
        {PRESET_CAMPAIGNS.map((preset) => (
          <li key={preset.id}>
            {/* Inset outline, so the panel's rounded clip never hides focus. */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(preset.id)}
              className="flex min-h-12 w-full items-center px-4 py-3 text-left text-base hover:bg-cream focus-visible:-outline-offset-3 disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
            >
              {preset.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
