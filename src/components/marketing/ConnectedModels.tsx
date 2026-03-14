export function ConnectedModels() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h2 className="text-4xl font-semibold tracking-tight">
          Connected Intelligence Ecosystem
        </h2>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          NutriCare integrates AI, lab data, wearable insights, and patient history 
          into a unified clinical intelligence layer.
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="premium-card">
            <h3 className="text-xl font-semibold">AI Nutrition Engine</h3>
            <p className="mt-3 text-gray-600 text-sm">
              Predictive dietary modeling powered by large language models.
            </p>
          </div>

          <div className="premium-card">
            <h3 className="text-xl font-semibold">Wearable Sync</h3>
            <p className="mt-3 text-gray-600 text-sm">
              Continuous glucose monitors, activity trackers, sleep analytics.
            </p>
          </div>

          <div className="premium-card">
            <h3 className="text-xl font-semibold">Clinical Data Hub</h3>
            <p className="mt-3 text-gray-600 text-sm">
              Lab panels, biomarkers, and EHR integrations in real time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}