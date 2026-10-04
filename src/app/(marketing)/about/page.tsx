import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm sm:p-8 md:p-10">
        <div className="max-w-4xl space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">About</Badge>
            <Badge variant="secondary">Nutrition</Badge>
            <Badge variant="secondary">Public health</Badge>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            NutriCare is built to make nutrition-driven health simple and measurable.
          </h1>

          <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
            Nutrition shapes long-term health outcomes, yet many people and programs lack simple tools to assess risk,
            guide choices, and track progress. NutriCare is a modern, privacy-first platform that brings clarity through
            evidence-based assessments and practical guidance.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/partners">For partners</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="grid gap-5 md:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Mission</CardTitle>
          </CardHeader>
          <CardContent className="leading-7 text-slate-600">
            Help individuals and health programs improve nutrition outcomes using clear assessments, practical guidance,
            and progress tracking.
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Vision</CardTitle>
          </CardHeader>
          <CardContent className="leading-7 text-slate-600">
            A world where nutrition-driven health decisions are accessible, understandable, and measurable for everyone.
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Principles */}
      <section className="space-y-5">
        <div className="max-w-2xl space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">
            How we build
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
            Clear enough to understand. Practical enough to use.
          </h2>
          <p className="text-base leading-7 text-slate-600">
            NutriCare is designed around clarity, responsible health information, and progress that people can actually
            follow over time.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              t: "Clear and evidence-based",
              d: "Use transparent assessments, understandable results, and practical guidance instead of opaque outputs.",
            },
            {
              t: "Privacy-conscious",
              d: "Keep personal information purposeful and use aggregated insights where reporting does not require individual detail.",
            },
            {
              t: "Built for progress",
              d: "Connect assessment, goals, plans, tracking, and adjustment so the experience supports an ongoing health journey.",
            },
          ].map((x) => (
            <Card
              key={x.t}
              className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <CardTitle className="text-lg">{x.t}</CardTitle>
              </CardHeader>
              <CardContent className="leading-7 text-slate-600">{x.d}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm sm:p-8">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Work with NutriCare
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
              Building a clearer path from nutrition insight to action.
            </h2>
            <p className="leading-7 text-slate-600">
              NutriCare is designed for practical use by individuals and programmes, with clear reporting,
              privacy-conscious practices, and a foundation that can grow with real-world needs.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button asChild>
              <Link href="/partners">Partner with us</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/impact">Explore our impact</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
