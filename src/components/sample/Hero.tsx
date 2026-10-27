export function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
      {/* Purple pill: white text is 4.48:1, so it must stay large and bold. */}
      <span className="inline-block -rotate-3 rounded-full bg-purple px-4 py-1 text-lg font-bold text-white">
        New for your salon
      </span>
      <h1 className="mt-4 text-4xl font-extrabold uppercase leading-tight tracking-tight sm:text-6xl">
        Fill your quiet weeks.
      </h1>
      <p className="mt-4 max-w-xl text-lg">
        Send a friendly note to clients who haven&apos;t booked in a while.
      </p>
      <p className="mt-2 max-w-xl text-lg font-semibold text-plum">
        Plum works for supporting text on cream.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-xl bg-yellow px-6 py-3 font-extrabold uppercase text-ink"
        >
          Start a message
        </button>
        <button
          type="button"
          className="rounded-xl border-2 border-ink px-6 py-3 font-extrabold uppercase text-ink"
        >
          Maybe later
        </button>
      </div>
    </section>
  );
}
