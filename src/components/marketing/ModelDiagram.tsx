import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Scale,
  Flame,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NodeItem = {
  title: string;
  desc: string;
  icon: LucideIcon;
  side: "left" | "right";
  top: string;
};

const nodes: NodeItem[] = [
  { title: "BMI", desc: "Interpretation + category", icon: Scale, side: "left", top: "top-6" },
  { title: "Calories", desc: "BMR/TDEE targets", icon: Flame, side: "left", top: "top-32" },
  { title: "Tracking", desc: "Trend over time", icon: Activity, side: "left", top: "top-60" },

  { title: "Reports", desc: "Partner snapshot", icon: FileText, side: "right", top: "top-6" },
  { title: "Safeguards", desc: "Privacy-first by design", icon: ShieldCheck, side: "right", top: "top-32" },
  { title: "Programs", desc: "Pilot-ready outcomes", icon: Users, side: "right", top: "top-60" },
];

function NodeCard({
  title,
  desc,
  icon: Icon,
}: {
  title: string;
  desc: string;
  icon: LucideIcon;
}) {
  return (
    <div className="w-[230px] rounded-3xl border bg-white p-4 shadow-lg transition hover:-translate-y-1 hover:shadow-xl animate-[float_6s_ease-in-out_infinite]">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-slate-50 p-2">
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

export function ModelDiagram() {
  return (
    <section className="rounded-3xl border bg-white p-10">

      {/* Title */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">How NutriCare fits together</h2>
        <p className="max-w-3xl text-slate-600">
          A simple engine that turns health inputs into actionable nutrition insights and reporting.
        </p>
      </div>

      {/* Canvas */}
      <div className="relative mt-12 rounded-3xl bg-slate-50 p-10 overflow-hidden">

        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        </div>

        {/* Desktop Diagram */}
        <div className="relative mx-auto max-w-6xl h-[380px] hidden md:block">

          {/* Engine */}
          <div className="absolute left-1/2 top-1/2 z-20 w-[380px] -translate-x-1/2 -translate-y-1/2">
            <Card className="rounded-3xl shadow-xl ring-1 ring-emerald-100">
              <CardHeader>
                <CardTitle>NutriCare Engine</CardTitle>
                <p className="text-sm text-slate-600">
                  Evidence-based logic • calm UX • privacy-first defaults
                </p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-1 text-sm text-slate-600 list-disc pl-5">
                  <li>Clear interpretation (not just numbers)</li>
                  <li>Practical nutrition guidance</li>
                  <li>Trends and progress tracking</li>
                  <li>Partner reporting snapshot</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Nodes */}
          {nodes.map((n) => (
            <div
              key={n.title}
              className={`absolute ${n.side === "left" ? "left-0" : "right-0"
                } ${n.top} z-10`}
            >
              <NodeCard title={n.title} desc={n.desc} icon={n.icon} />
            </div>
          ))}

          {/* SVG connectors */}
          <svg
            className="absolute inset-0 z-0 pointer-events-none"
            viewBox="0 0 1000 380"
            fill="none"
          >
            <defs>
              <linearGradient id="flow" x1="0" x2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#166534" />
              </linearGradient>
            </defs>

            {/* INPUT LINES */}

            <path
              id="in1"
              d="M200 70 C 360 70, 420 130, 470 160"
              stroke="url(#flow)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            <path
              id="in2"
              d="M200 170 C 360 170, 420 190, 470 190"
              stroke="url(#flow)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            <path
              id="in3"
              d="M200 300 C 360 300, 420 250, 470 230"
              stroke="url(#flow)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            {/* OUTPUT LINES */}

            <path
              id="out1"
              d="M530 160 C 600 130, 650 70, 800 70"
              stroke="url(#flow)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            <path
              id="out2"
              d="M530 190 C 640 190, 650 170, 800 170"
              stroke="url(#flow)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            <path
              id="out3"
              d="M530 230 C 640 260, 660 300, 800 300"
              stroke="url(#flow)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            {/* DATA FLOW PARTICLES */}

            {["in1", "in2", "in3", "out1", "out2", "out3"].map((p) => (
              <circle key={p} r="3" fill="#10b981">
                <animateMotion dur="5s" repeatCount="indefinite">
                  <mpath href={`#${p}`} />
                </animateMotion>
              </circle>
            ))}
          </svg>
        </div>

        {/* Mobile Layout */}

        <div className="grid gap-4 md:hidden mt-6">

          <NodeCard title="BMI" desc="Interpretation + category" icon={Scale} />
          <NodeCard title="Calories" desc="BMR/TDEE targets" icon={Flame} />
          <NodeCard title="Tracking" desc="Trend over time" icon={Activity} />

          <div className="rounded-2xl border bg-white p-5 shadow-sm text-center font-semibold">
            NutriCare Engine
          </div>

          <NodeCard title="Reports" desc="Partner snapshot" icon={FileText} />
          <NodeCard title="Safeguards" desc="Privacy-first by design" icon={ShieldCheck} />
          <NodeCard title="Programs" desc="Pilot-ready outcomes" icon={Users} />

        </div>
      </div>
    </section>
  );
}