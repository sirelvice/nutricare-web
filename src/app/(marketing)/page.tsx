import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { ModelDiagram } from "@/components/marketing/ModelDiagram";
import { FAQ } from "@/components/marketing/FAQ";

export const metadata = {
  title: "Home",
  description:
    "Transform nutrition data into intelligent health insights with NutriCare.",
};

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm sm:p-8 md:p-10 lg:p-12">
        <div className="max-w-4xl">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Evidence-based</Badge>
            <Badge variant="secondary">Privacy-first</Badge>
            <Badge variant="secondary">Partner-ready</Badge>
          </div>

          <div className="mt-6 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Nutrition intelligence
            </p>

            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              NutriCare — nutrition intelligence for healthier lives
            </h1>

            <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              Assess key health indicators like BMI, receive practical nutrition
              guidance, and track your progress over time — all in a clear and
              privacy-first experience designed for real impact.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/impact">View impact</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              { k: "Assess", v: "BMI & core metrics with clear interpretation" },
              { k: "Guide", v: "Targets and practical nutrition guidance" },
              { k: "Track", v: "Progress trends that show improvement over time" },
            ].map((x) => (
              <div
                key={x.k}
                className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
              >
                <div className="text-sm font-semibold text-slate-950">{x.k}</div>
                <div className="mt-1 text-sm leading-6 text-slate-600">{x.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODEL */}
      <ModelDiagram />

      {/* WHAT WE DO */}
      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">
              How it works
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
              What NutriCare does
            </h2>
            <p className="max-w-2xl leading-6 text-slate-600">
              A simple, trustworthy experience for people — and a scalable
              foundation for partners.
            </p>
          </div>

          <Button asChild variant="ghost" className="self-start sm:self-auto">
            <Link href="/tools/bmi">Try BMI tool →</Link>
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Health assessments",
              description:
                "BMI today, then more assessments over time — always with clear explanations, not just numbers.",
            },
            {
              title: "Nutrition guidance",
              description:
                "Practical targets and guidance designed to be understandable, local-friendly, and easy to follow.",
            },
            {
              title: "Progress tracking",
              description:
                "Trends over time so users can see improvement — and partners can measure outcomes responsibly.",
            },
          ].map((item) => (
            <Card
              key={item.title}
              className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <CardHeader className="p-6 pb-3">
                <CardTitle className="text-lg text-slate-950">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-1 leading-6 text-slate-600">
                {item.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* TRUST / CREDIBILITY */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="max-w-3xl space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">
            Built for trust
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
            Trust & credibility
          </h2>
          <p className="leading-7 text-slate-600">
            NutriCare is designed with privacy-first principles and transparent
            health calculations, so users can trust their results — and partners
            can trust the foundation for responsible health programs.
          </p>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              t: "Transparent methods",
              d: "Clear formulas and understandable outputs.",
            },
            {
              t: "Clinical tone",
              d: "Calm, professional design and language.",
            },
            {
              t: "Privacy-first",
              d: "Collect only what is necessary.",
            },
            {
              t: "Partner-ready",
              d: "Built to support pilots and reporting.",
            },
          ].map((x) => (
            <div
              key={x.t}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="text-sm font-semibold text-slate-950">{x.t}</div>
              <div className="mt-1 text-sm leading-6 text-slate-600">{x.d}</div>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/partners">For partners</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/about">About NutriCare</Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* CTA BAND */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm sm:p-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Take the next step
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
              Start with a simple assessment.
            </h2>
            <p className="leading-6 text-slate-600">
              Try the BMI tool and see how NutriCare turns basic inputs into
              clear, useful guidance.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button asChild>
              <Link href="/tools/bmi">Open BMI tool</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Create an account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
