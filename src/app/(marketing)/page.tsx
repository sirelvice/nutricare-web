import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// New imports
import { ModelDiagram } from "@/components/marketing/ModelDiagram";
import { FAQ } from "@/components/marketing/FAQ";

export const metadata = {
  title: "Home",
  description:
    "Transform nutrition data into intelligent health insights with NutriCare.",
};

export default function HomePage() {
  return (
    <div className="space-y-14">
      {/* HERO */}
      <section className="rounded-3xl border bg-gradient-to-b from-slate-50 to-white p-8 md:p-12">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Evidence-based</Badge>
            <Badge variant="secondary">Privacy-first</Badge>
            <Badge variant="secondary">Partner-ready</Badge>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            NutriCare — nutrition intelligence for healthier lives
          </h1>

          <p className="max-w-2xl text-base text-slate-600 md:text-lg leading-relaxed">
            Assess key health indicators like BMI, receive practical nutrition guidance,
            and track your progress over time — all in a clear and privacy-first experience designed for real impact.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/impact">View impact</Link>
            </Button>
          </div>

          <div className="grid gap-3 pt-4 md:grid-cols-3">
            {[
              { k: "Assess", v: "BMI & core metrics with clear interpretation" },
              { k: "Guide", v: "Targets and practical nutrition guidance" },
              { k: "Track", v: "Progress trends that show improvement over time" },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="text-sm font-semibold">{x.k}</div>
                <div className="mt-1 text-sm text-slate-600">{x.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Model Diagram - right after HERO */}
      <ModelDiagram />

      {/* WHAT WE DO */}
      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold md:text-2xl">What NutriCare does</h2>
            <p className="max-w-2xl text-slate-600">
              A simple, trustworthy experience for people — and a scalable foundation for partners.
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link href="/tools/bmi">Try BMI tool →</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">Health assessments</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600">
              BMI today, then more assessments over time — always with clear explanations, not just numbers.
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">Nutrition guidance</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600">
              Practical targets and guidance designed to be understandable, local-friendly, and easy to follow.
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">Progress tracking</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600">
              Trends over time so users can see improvement — and partners can measure outcomes responsibly.
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* TRUST / CREDIBILITY */}
      <section className="rounded-3xl border p-8">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold md:text-2xl">Trust & credibility</h2>
          <p className="max-w-3xl text-slate-600">
            NutriCare is designed with with privacy-first principles and transparent health calculations, so users can trust their results — and partners can trust the foundation for responsible health programs.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            { t: "Transparent methods", d: "Clear formulas and understandable outputs." },
            { t: "Clinical tone", d: "Calm, professional design and language." },
            { t: "Privacy-first", d: "Collect only what is necessary." },
            { t: "Partner-ready", d: "Built to support pilots and reporting." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-semibold">{x.t}</div>
              <div className="mt-1 text-sm text-slate-600">{x.d}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/partners">For partners</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/about">About NutriCare</Link>
          </Button>
        </div>
      </section>

      {/* FAQ - after Trust & credibility */}
      <FAQ />

      {/* CTA BAND */}
      <section className="rounded-3xl border bg-white p-8">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold md:text-2xl">
              Start with a simple assessment.
            </h2>
            <p className="text-slate-600">
              Try the BMI tool and see how NutriCare turns basic inputs into clear, useful guidance.
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