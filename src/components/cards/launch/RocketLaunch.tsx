"use client";

/**
 * The rocket that takes off while a campaign launches. Loaded on demand (see
 * LaunchDialog), so motion stays out of the main bundle. Only transform and
 * opacity animate, which keeps it smooth on slow phones.
 */
import { motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";

const FLIGHT_MS = 2000;
const STATIC_MS = 300;

const SHAKE_S = 0.45;
const LIFT_S = 1.3;

/** Smoke left at the launch pad. x/y in px, colour classes from the brand palette. */
const PUFFS = [
  { x: -30, y: 4, size: "size-5", colour: "bg-pink/60", delay: 0.3 },
  { x: 30, y: 6, size: "size-5", colour: "bg-plum/40", delay: 0.34 },
  { x: -16, y: 12, size: "size-6", colour: "bg-yellow", delay: 0.42 },
  { x: 16, y: 12, size: "size-6", colour: "bg-pink/60", delay: 0.46 },
  { x: -4, y: 18, size: "size-7", colour: "bg-plum/30", delay: 0.55 },
  { x: 6, y: 16, size: "size-5", colour: "bg-yellow", delay: 0.62 },
] as const;

type RocketLaunchProps = {
  /** Runs once, when the animation (or the short static moment) is over. */
  onFinished: () => void;
};

export default function RocketLaunch({ onFinished }: RocketLaunchProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(onFinished, reduced ? STATIC_MS : FLIGHT_MS);
    return () => clearTimeout(timer);
  }, [reduced, onFinished]);

  // Sits over Steve's hidden bubble; the dialog lets it fly out of the top.
  const stage = "pointer-events-none absolute inset-x-0 top-4 flex justify-center sm:top-5";

  if (reduced) {
    return (
      <div aria-hidden="true" className={`${stage} h-12 items-center gap-2 font-bold text-plum`}>
        <RocketShape className="h-8 w-5" />
        Launching
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={stage}>
      <div className="relative h-24 w-12">
        {PUFFS.map((puff) => (
          <motion.span
            key={`${puff.x}-${puff.y}`}
            className={`absolute top-14 left-1/2 -ml-3 rounded-full ${puff.size} ${puff.colour}`}
            initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.3, 1, 1.9], x: puff.x, y: puff.y }}
            transition={{ delay: puff.delay, duration: 1, ease: "easeOut" }}
          />
        ))}

        {/* Lift-off: slow at first, then fast, fading as it leaves. */}
        <motion.div
          className="absolute inset-x-0 top-0 flex flex-col items-center"
          initial={{ y: "0vh", opacity: 1 }}
          animate={{ y: "-75vh", opacity: [1, 1, 0] }}
          transition={{
            delay: SHAKE_S,
            duration: LIFT_S,
            ease: [0.55, 0, 0.8, 0.2],
            opacity: { delay: SHAKE_S, duration: LIFT_S, times: [0, 0.65, 1] },
          }}
        >
          {/* Anticipation: a short rattle before it goes. */}
          <motion.div
            animate={{ x: [0, -2, 2, -2, 2, -1.5, 1.5, 0], rotate: [0, -3, 3, -3, 3, -2, 2, 0] }}
            transition={{ duration: SHAKE_S, ease: "linear" }}
          >
            <RocketShape className="h-14 w-9" />
          </motion.div>
          {/* Flame: grows in during the rattle, then flickers. */}
          <motion.div
            className="-mt-1 origin-top"
            initial={{ opacity: 0, scaleY: 0.2 }}
            animate={{ opacity: 1, scaleY: [0.7, 1.25, 0.9, 1.3] }}
            transition={{
              opacity: { delay: 0.15, duration: 0.2 },
              scaleY: { delay: 0.15, duration: 0.24, repeat: Infinity, repeatType: "mirror" },
            }}
          >
            <Flame />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/** An upright rocket in the brand colours. */
function RocketShape({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 40 64" className={className}>
      <path d="M10 34 2 52l9-4Z" className="fill-pink stroke-burgundy" strokeWidth="2" strokeLinejoin="round" />
      <path d="M30 34 38 52l-9-4Z" className="fill-pink stroke-burgundy" strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M20 2c9 9 12 24 10 46H10C8 26 11 11 20 2Z"
        className="fill-cream stroke-burgundy"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="22" r="5" className="fill-purple stroke-burgundy" strokeWidth="2" />
      <rect x="14" y="48" width="12" height="6" rx="1.5" className="fill-plum" />
    </svg>
  );
}

function Flame() {
  return (
    <svg viewBox="0 0 20 34" className="h-8 w-5">
      <path d="M10 34C2 22 1 10 4 0h12c3 10 2 22-6 34Z" className="fill-yellow" />
      <path d="M10 24C6 16 6 8 7 0h6c1 8 1 16-3 24Z" className="fill-pink" />
    </svg>
  );
}
