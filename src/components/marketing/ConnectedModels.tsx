import { Brain, Cloud, ShieldCheck, Sparkles } from "lucide-react"

export default function ConnectedModels() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-black to-neutral-950 text-white">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-semibold mb-12">
          Intelligent Health Engine
        </h2>

        <div className="relative flex justify-center items-center">

          {/* Center Card */}
          <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 w-80 shadow-xl">
            <h3 className="text-xl font-medium mb-4">DailyCare AI Core</h3>
            <p className="text-sm text-white/60">
              Unified health intelligence powering your metrics.
            </p>
          </div>

          {/* Floating Icons */}
          <div className="absolute -left-48 top-0 flex flex-col gap-12">
            <Brain className="w-10 h-10 text-white/60" />
            <Cloud className="w-10 h-10 text-white/60" />
          </div>

          <div className="absolute -right-48 top-0 flex flex-col gap-12">
            <ShieldCheck className="w-10 h-10 text-white/60" />
            <Sparkles className="w-10 h-10 text-white/60" />
          </div>

        </div>
      </div>
    </section>
  )
}