import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">About</Badge>
          <Badge variant="secondary">Nutrition</Badge>
          <Badge variant="secondary">Public health</Badge>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          NutriCare is built to make nutrition-driven health simple and measurable.
        </h1>

        <p className="max-w-3xl text-slate-600">
          Nutrition shapes long-term health outcomes, yet many people and programs lack simple tools to assess risk,
          guide choices, and track progress. NutriCare is a modern, privacy-first platform that brings clarity through
          evidence-based assessments and practical guidance.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/partners">For partners</Link>
          </Button>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Mission</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-600">
            Help individuals and health programs improve nutrition outcomes using clear assessments, practical guidance,
            and progress tracking.
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Vision</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-600">
            A world where nutrition-driven health decisions are accessible, understandable, and measurable — for everyone.
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Principles */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold md:text-2xl">Design principles</h2>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: "Evidence-based",
              d: "We use transparent formulas and clear interpretation — no mystery outputs.",
            },
            {
              t: "Privacy-first",
              d: "Collect only what is necessary, and prefer aggregated insights for reporting.",
            },
            {
              t: "Built to scale",
              d: "Start simple, add capabilities cleanly, and keep a stable core architecture.",
            },
          ].map((x) => (
            <Card key={x.t} className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg">{x.t}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600">{x.d}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-3xl border bg-slate-50 p-8">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold md:text-2xl">Want to support a pilot?</h2>
            <p className="text-slate-600">
              NutriCare is structured for real-world deployments with clear reporting, privacy-first practices,
              and a scalable product foundation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button asChild>
              <Link href="/partners">Partner with us</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/impact">View impact</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
