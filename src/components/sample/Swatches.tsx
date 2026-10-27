type Swatch = {
  name: string;
  hex: string;
  className: string;
  use: string;
};

// Full class names so Tailwind can find them. Hex is shown as text only.
const swatches: Swatch[] = [
  { name: "aubergine", hex: "#36031B", className: "bg-aubergine", use: "Header" },
  { name: "burgundy", hex: "#5A0E2E", className: "bg-burgundy", use: "Dark sections" },
  { name: "plum", hex: "#8B1A4A", className: "bg-plum", use: "Cards, text on cream" },
  { name: "pink", hex: "#EF6FAE", className: "bg-pink", use: "Accents on dark" },
  { name: "yellow", hex: "#FBF46B", className: "bg-yellow", use: "Primary buttons" },
  { name: "cream", hex: "#FDF3EA", className: "bg-cream", use: "Page background" },
  { name: "ink", hex: "#2A0016", className: "bg-ink", use: "Text" },
  { name: "purple", hex: "#7B5CF5", className: "bg-purple", use: "Focus ring, large tags" },
];

export function Swatches() {
  return (
    <section id="swatches" className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h2 className="text-2xl font-extrabold uppercase">The palette</h2>
      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {swatches.map((s) => (
          <li key={s.name}>
            <div className={`h-20 rounded-2xl border border-ink/15 ${s.className}`} />
            <p className="mt-2 font-bold">{s.name}</p>
            <p className="text-sm">
              {s.hex} · {s.use}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
