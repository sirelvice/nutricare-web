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

function NodeCard({ title, desc, icon: Icon }: { title: string; desc: string; icon: LucideIcon }) {
  return (
    <div className="w-[230px] rounded-3xl border bg-white p-4 shadow-lg hover:-translate-y-1 hover:shadow-xl transition">
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
          <div className="h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
        </div>

        {/* Desktop Diagram */}
        <div className="relative mx-auto max-w-6xl h-[380px] hidden md:block">

          {/* Center Engine */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] z-20">
            <Card className="rounded-3xl shadow-xl">
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

          {/* Left Nodes */}
          {nodes
            .filter((n) => n.side === "left")
            .map((n) => (
              <div key={n.title} className={`absolute left-0 ${n.top} z-10`}>
                <NodeCard title={n.title} desc={n.desc} icon={n.icon} />
              </div>
            ))}

          {/* Right Nodes */}
          {nodes
            .filter((n) => n.side === "right")
            .map((n) => (
              <div key={n.title} className={`absolute right-0 ${n.top} z-10`}>
                <NodeCard title={n.title} desc={n.desc} icon={n.icon} />
              </div>
            ))}

          {/* SVG Connections */}
          <svg
            className="absolute inset-0 pointer-events-none z-0"
            viewBox="0 0 1000 380"
            fill="none"
          >

            {/* LEFT INPUTS */}

            <path id="left1"
              d="M200 70 C 360 70, 420 130, 470 160"
              stroke="rgba(239,68,68,0.6)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            <path id="left2"
              d="M200 170 C 360 170, 420 190, 470 190"
              stroke="rgba(239,68,68,0.6)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            <path id="left3"
              d="M200 300 C 360 300, 420 250, 470 230"
              stroke="rgba(239,68,68,0.6)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            {/* RIGHT OUTPUTS */}

            <path id="right1"
              d="M530 160 C 580 130, 640 70, 800 70"
              stroke="rgba(34,197,94,0.6)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            <path id="right2"
              d="M530 190 C 620 190, 640 170, 800 170"
              stroke="rgba(34,197,94,0.6)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            <path id="right3"
              d="M530 230 C 640 260, 660 300, 800 300"
              stroke="rgba(34,197,94,0.6)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            {/* FLOW PARTICLES */}

            {[ "left1","left2","left3","right1","right2","right3" ].map((p) => (
              <circle key={p} r="3" fill="#94a3b8">
                <animateMotion
                  dur="6s"
                  repeatCount="indefinite"
                >
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