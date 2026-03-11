const faqs = [
  {
    q: "Is NutriCare a medical diagnosis tool?",
    a: "No. NutriCare provides screening-style insights (like BMI) and practical nutrition guidance. It’s not a substitute for clinical assessment or diagnosis.",
  },
  {
    q: "How do you handle privacy?",
    a: "NutriCare is designed to collect only what is necessary. Partner reporting is intended to be aggregated (no individual health records shared by default).",
  },
  {
    q: "What does BMI miss?",
    a: "BMI is a simple screening metric. It doesn’t directly measure body fat, muscle mass, or distribution, and may not fit every individual equally.",
  },
  {
    q: "Can I track progress over time?",
    a: "Yes. You can save weight entries and view trends/history to focus on direction, not single numbers.",
  },
  {
    q: "Can partners use NutriCare for pilots?",
    a: "Yes. The product is structured for outcomes and reporting, with safeguards and a partner-friendly narrative built in.",
  },
];

export function FAQ() {
  return (
    <section className="rounded-3xl border bg-white p-6 md:p-10">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold md:text-2xl">FAQs</h2>
        <p className="max-w-3xl text-slate-600">
          Short answers for common questions. We keep the tone calm and practical.
        </p>
      </div>

      <div className="mt-6 grid gap-3">
        {faqs.map((f) => (
          <details key={f.q} className="group rounded-3xl border bg-slate-50 p-5">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
              <span className="mr-2 inline-block rounded-full bg-white px-3 py-1 text-xs text-slate-600 border">
                Q
              </span>
              {f.q}
              <span className="float-right text-slate-400 group-open:rotate-45 transition">+</span>
            </summary>
            <div className="mt-3 text-sm text-slate-600 leading-relaxed">
              {f.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
