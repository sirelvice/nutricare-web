import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Scale,
  Flame,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";

type NodeItem = {
  title: string;
  desc: string;
  icon: any;
  side: "left" | "right";
  top: string; // tailwind top like "top-4"
};

const nodes: NodeItem[] = [
  { title: "BMI", desc: "Interpretation + category", icon: Scale, side: "left", top: "top-4" },
  { title: "Calories", desc: "BMR/TDEE targets", icon: Flame, side: "left", top: "top-28" },
  { title: "Tracking", desc: "Trend over time", icon: Activity, side: "left", top: "top-52" },

  { title: "Reports", desc: "Partner snapshot", icon: FileText, side: "right", top: "top-4" },
  { title: "Safeguards", desc: "Privacy-first by design", icon: ShieldCheck, side: "right", top: "top-28" },
  { title: "Programs", desc: "Pilot-ready outcomes", icon: Users, side: "right", top: "top-52" },
];

function NodeCard({ title, desc, icon: Icon }: { title: string; desc: string; icon: any }) {
  return (
    <div className="w-[220px] rounded-3xl border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-slate-50 p-2">
          <Icon size={18} className="text-slate-700" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-xs text-slate-600">{desc}</div>
        </div>
      </div>
    </div>
  );
}

function Dot({ className }: { className: string }) {
  return (
    <span
      className={[
        "absolute h-2 w-2 rounded-full bg-slate-300",
        "animate-pulse",
        className,
      ].join(" ")}
    />
  );
}

export function ModelDiagram() {
  return (
    <section className="rounded-3xl border bg-white p-6 md:p-10">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold md:text-2xl">How NutriCare fits together</h2>
        <p className="max-w-3xl text-slate-600">
          A simple engine that turns basic inputs into clear guidance, progress tracking, and partner-ready reporting.
        </p>
      </div>

      <div className="relative mt-8 overflow-hidden rounded-3xl bg-slate-50 p-6 md:p-10">
        {/* Diagram canvas */}
        <div className="relative mx-auto max-w-5xl">
          {/* Center card */}
          <div className="relative mx-auto w-full max-w-[360px]">
            <Card className="rounded-3xl">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">NutriCare Engine</CardTitle>
                <div className="text-sm text-slate-600">
                  Evidence-based logic • calm UX • privacy-first defaults
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-xs font-semibold text-slate-900">Outputs</div>
                  <ul className="mt-1 list-disc pl-5 text-xs text-slate-600 space-y-1">
                    <li>Clear interpretation (not just numbers)</li>
                    <li>Practical nutrition guidance</li>
                    <li>Trends + history</li>
                    <li>Aggregated partner snapshot</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Left nodes */}
          <div className="pointer-events-none absolute left-0 top-0 hidden h-[320px] w-[240px] md:block">
            {nodes
              .filter((n) => n.side === "left")
              .map((n) => (
                <div key={n.title} className={["absolute left-0", n.top].join(" ")}>
                  <NodeCard title={n.title} desc={n.desc} icon={n.icon} />
                </div>
              ))}
          </div>

          {/* Right nodes */}
          <div className="pointer-events-none absolute right-0 top-0 hidden h-[320px] w-[240px] md:block">
            {nodes
              .filter((n) => n.side === "right")
              .map((n) => (
                <div key={n.title} className={["absolute right-0", n.top].join(" ")}>
                  <NodeCard title={n.title} desc={n.desc} icon={n.icon} />
                </div>
              ))}
          </div>

          {/* Mobile nodes (stacked) */}
          <div className="mt-6 grid gap-3 md:hidden">
            {nodes.map((n) => (
              <NodeCard key={n.title} title={n.title} desc={n.desc} icon={n.icon} />
            ))}
          </div>

          {/* SVG connectors (desktop) */}
          <svg
            className="pointer-events-none absolute left-0 top-0 hidden h-[320px] w-full md:block"
            viewBox="0 0 1000 320"
            fill="none"
          >
            {/* dashed lines to center */}
            <path d="M240 40 C 380 40, 380 80, 500 90" stroke="rgba(100,116,139,0.55)" strokeWidth="2" strokeDasharray="4 6" />
            <path d="M240 140 C 380 140, 390 150, 500 150" stroke="rgba(100,116,139,0.55)" strokeWidth="2" strokeDasharray="4 6" />
            <path d="M240 240 C 390 240, 410 220, 500 210" stroke="rgba(100,116,139,0.55)" strokeWidth="2" strokeDasharray="4 6" />

            <path d="M760 40 C 620 40, 620 80, 500 90" stroke="rgba(100,116,139,0.55)" strokeWidth="2" strokeDasharray="4 6" />
            <path d="M760 140 C 620 140, 610 150, 500 150" stroke="rgba(100,116,139,0.55)" strokeWidth="2" strokeDasharray="4 6" />
            <path d="M760 240 C 610 240, 590 220, 500 210" stroke="rgba(100,116,139,0.55)" strokeWidth="2" strokeDasharray="4 6" />
          </svg>

          {/* Pulsing dots near center (desktop) */}
          <Dot className="hidden md:block left-1/2 top-[86px] -translate-x-1/2" />
          <Dot className="hidden md:block left-1/2 top-[146px] -translate-x-1/2" />
          <Dot className="hidden md:block left-1/2 top-[206px] -translate-x-1/2" />
        </div>
      </div>
    </section>
  );
}
