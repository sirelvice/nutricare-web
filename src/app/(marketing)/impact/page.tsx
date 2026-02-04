import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ImpactPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Impact</Badge>
          <Badge variant="secondary">Pilot-ready</Badge>
          <Badge variant="secondary">Privacy-first</Badge>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Measuring nutrition-driven health outcomes.
        </h1>

        <p className="max-w-3xl text-slate-600">
          NutriCare is designed to support responsible, anonymized reporting for pilots — helping partners
          understand trends, identify risks early, and improve nutrition interventions.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/partners">Partner with us</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </section>

      {/* KPI cards (demo placeholders) */}
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { k: "Screenings", v: "—", d: "Users assessed (pilot/demo)" },
          { k: "Risk flags", v: "—", d: "Users flagged for follow-up" },
          { k: "Trend insights", v: "—", d: "Changes over time detected" },
          { k: "Reports", v: "—", d: "Exportable summaries (planned)" },
        ].map((x) => (
          <Card key={x.k} className="rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">{x.k}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{x.v}</div>
              <div className="mt-1 text-xs text-slate-500">{x.d}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Separator />

      {/* What we measure */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold md:text-2xl">What NutriCare helps measure</h2>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: "Nutrition status indicators",
              d: "BMI categories and trend direction over time (screening-level).",
            },
            {
              t: "Early risk identification",
              d: "Simple flags for follow-up when patterns suggest increased risk.",
            },
            {
              t: "Program-level trends",
              d: "Aggregated insights by age group, location, or time period (anonymized).",
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

      {/* Privacy note */}
      <section className="rounded-3xl border bg-slate-50 p-8">
        <h2 className="text-lg font-semibold">Privacy & ethics</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          NutriCare is built to minimize personal data collection. For partner reporting, we focus on
          aggregated and anonymized insights wherever possible.
        </p>
      </section>

      {/* CTA */}
      <section className="rounded-3xl border bg-white p-8">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold md:text-2xl">Want to run a pilot?</h2>
            <p className="text-slate-600">
              We can support pilots with clear onboarding, lightweight reporting, and a scalable product foundation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button asChild>
              <Link href="/partners">View partner model</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/about">Learn more</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
