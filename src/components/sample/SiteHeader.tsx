export function SiteHeader() {
  return (
    <header className="bg-aubergine text-cream">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <span className="text-xl font-extrabold tracking-tight">Lumen</span>
        <a
          href="#swatches"
          className="rounded-xl bg-yellow px-4 py-2.5 text-sm font-extrabold uppercase text-ink"
        >
          See colors
        </a>
      </div>
    </header>
  );
}
