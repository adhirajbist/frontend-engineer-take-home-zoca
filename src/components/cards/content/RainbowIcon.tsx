import { PencilSparkles } from "lucide-react";
import { useId } from "react";

/** Each stop takes its colour from a rainbow token via currentColor. */
const STOPS = [
  "text-rainbow-1",
  "text-rainbow-2",
  "text-rainbow-3",
  "text-rainbow-4",
  "text-rainbow-5",
  "text-rainbow-6",
];

/** The AI edit icon, stroked with a rainbow gradient. Decorative. */
export function RainbowIcon({ className }: { className?: string }) {
  const gradientId = useId();
  return (
    <PencilSparkles aria-hidden="true" stroke={`url(#${gradientId})`} className={className}>
      <defs>
        {/* userSpaceOnUse: one gradient across the whole 24x24 icon, so
            straight lines (zero-height boxes) are coloured too. */}
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22">
          {STOPS.map((stop, index) => (
            <stop
              key={stop}
              offset={index / (STOPS.length - 1)}
              stopColor="currentColor"
              className={stop}
            />
          ))}
        </linearGradient>
      </defs>
    </PencilSparkles>
  );
}
