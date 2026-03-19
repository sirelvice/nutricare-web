const faqs = [
  {
    q: "Is NutriCare a medical diagnosis tool?",
    a: "No. NutriCare provides screening-style insights (such as BMI) and practical nutrition guidance. It is not a substitute for professional medical diagnosis or clinical assessments. Always consult healthcare professionals for personalized medical advice.",
  },
  {
    q: "How is my data handled and protected?",
    a: "NutriCare is designed to collect only what is necessary. Partner reporting is intended to be aggregated (no individual health records shared by default) and we follow best practices for data security and privacy. We are transparent about data use and provide controls for users.",
  },
  {
    q: "What are the limitations of BMI?",
    a: "BMI is a simple screening metric. It doesn’t directly measure body fat, muscle mass, or distribution, and may not fit every individual equally well. NutriCare uses BMI as a starting point for general guidance, but encourages users to focus on overall health and habits rather than just the number.",
  },
  {
    q: "Can I track progress over time?",
    a: "Yes. You can save weight entries and view trends/history to focus on direction, not single numbers. NutriCare emphasizes sustainable habits and overall well-being rather than just weight changes.",
  },
  {
    q: "Can organizations or partners use NutriCare?",
    a: "Yes. The product is structured for outcomes and reporting, with safeguards and a partner-friendly narrative built in to ensure responsible use. We welcome partnerships that align with our mission of promoting health and well-being.",
  },
];

export function FAQ() {
  return (
    <section className="rounded-3xl border bg-white p-6 md:p-10">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold md:text-2xl">
          Frequently asked questions
        </h2>
        <p className="max-w-3xl text-slate-600">
          Short, clear answers to common questions about NutriCare, its purpose, data handling, and how it can be used. If you have other questions, feel free to reach out!
        </p>
      </div>

      <div className="mt-6 grid gap-3">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="group rounded-2xl border bg-slate-50 p-5 transition hover:bg-slate-100"
          >
            <summary className="cursor-pointer text-sm font-semibold text-slate-900 flex items-center justify-between">
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