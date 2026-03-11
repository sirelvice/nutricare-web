export function Marquee() {
  const items = [
    "BMI",
    "Calories",
    "Macros",
    "Weight tracking",
    "Recommendations",
    "Privacy-first",
    "Partner-ready",
    "Evidence-based",
  ];

  // Duplicate to create seamless loop
  const row = [...items, ...items];

  return (
    <section className="rounded-3xl border bg-white p-4 md:p-6">
      <div className="text-sm font-semibold text-slate-900">What you can do in NutriCare</div>
      <div className="mt-3 overflow-hidden rounded-2xl bg-slate-50">
        <div className="marquee hover:[animation-play-state:paused]">
          {row.map((x, i) => (
            <div
              key={`${x}-${i}`}
              className="mx-3 my-3 inline-flex items-center rounded-full border bg-white px-4 py-2 text-sm text-slate-700 shadow-sm"
            >
              {x}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">Tip: hover the strip to pause.</p>
    </section>
  );
}
