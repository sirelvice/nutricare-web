const faqs = [
  { q: "Is NutriCare free to use?", a: "The core experience is free. There is no payment or subscription requirement today." },
  { q: "What can I do with NutriCare?", a: "Create a profile, explore calorie and macro estimates, record your weight and review saved plans and history. You can also download a personal PDF report. Some guidance requires an eligible profile and enough recorded information." },
  { q: "Does NutriCare replace medical advice?", a: "No. NutriCare offers calculations and personal guidance to support understanding. It does not provide medical diagnosis or treatment." },
  { q: "Where can I ask about privacy or partnerships?", a: "Read the Privacy Policy for information about data use, or use the Contact page to ask a question. Organisations can start a conversation through the For Partners page." },
];

export function FAQ() {
  return (
    <section className="rounded-3xl border bg-white p-6 md:p-10">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold md:text-2xl">
          Frequently asked questions
        </h2>
        <p className="max-w-3xl text-slate-600">
          A few things to know before you begin.
        </p>
      </div>

      <div className="mt-6 grid gap-3">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="group rounded-2xl border border-emerald-100 bg-white p-5 transition-colors hover:bg-emerald-50/60"
          >
            <summary className="cursor-pointer rounded-md text-sm font-semibold text-slate-900 flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span>{f.q}</span>
              <span className="text-slate-400 transition-transform group-open:rotate-45 pointer-events-none">
                +
              </span>
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