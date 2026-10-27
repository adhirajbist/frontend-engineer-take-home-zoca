export function FeatureBand() {
  return (
    <section className="bg-burgundy text-cream">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12 sm:grid-cols-2 sm:px-6">
        <div className="rounded-3xl bg-plum p-6">
          <p className="text-sm font-bold uppercase tracking-widest text-yellow">Step 1</p>
          <h2 className="mt-2 text-2xl font-extrabold uppercase">Pick who to invite</h2>
          <p className="mt-2">Cream and yellow both read well on plum.</p>
        </div>
        <div className="p-6">
          <p className="text-sm font-bold uppercase tracking-widest text-pink">Step 2</p>
          <h2 className="mt-2 text-2xl font-extrabold uppercase">Write your note</h2>
          <p className="mt-2">Pink works as small text on burgundy and aubergine only.</p>
          <span className="mt-4 inline-block rounded-full bg-pink px-3 py-1 text-sm font-bold text-ink">
            Ink on pink
          </span>
        </div>
      </div>
    </section>
  );
}
