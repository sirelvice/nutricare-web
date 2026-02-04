import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PartnersPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">For Partners</Badge>
          <Badge variant="secondary">Clinics</Badge>
          <Badge variant="secondary">NGOs</Badge>
          <Badge variant="secondary">Donors</Badge>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Deploy NutriCare for pilots and programs.
        </h1>

        <p className="max-w-3xl text-slate-600">
          NutriCare supports nutrition-driven health screening and guidance with a platform designed for
          scalability, responsible reporting, and real-world adoption.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/register">Start a pilot</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/impact">See impact model</Link>
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-3xl border p-8">
        <h2 className="text-xl font-semibold md:text-2xl">How a pilot works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              n: "1",
              t: "Scope the pilot",
              d: "Define target groups, locations, and success metrics.",
            },
            {
              n: "2",
              t: "Onboard users",
              d: "Lightweight onboarding for staff and participants.",
            },
            {
              n: "3",
              t: "Report outcomes",
              d: "Aggregated insights and exportable reporting (planned).",
            },
          ].map((x) => (
            <div key={x.n} className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-semibold">Step {x.n}</div>
              <div className="mt-1 text-sm font-semibold">{x.t}</div>
              <div className="mt-1 text-sm text-slate-600">{x.d}</div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* What partners get */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold md:text-2xl">What partners get</h2>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: "Program-ready UX",
              d: "A simple user experience designed for clarity and adoption.",
            },
            {
              t: "Responsible insights",
              d: "Focus on aggregated trends and privacy-first reporting.",
            },
            {
              t: "Scalable foundation",
              d: "Built to expand from a pilot into a full product ecosystem.",
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

      {/* Data & governance */}
      <section className="rounded-3xl border bg-white p-8">
        <h2 className="text-xl font-semibold md:text-2xl">Data & governance</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          We prioritize minimal data collection, clear consent, and privacy-first implementation. Pilot reporting is
          designed to be aggregated and anonymized wherever possible.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/about">About NutriCare</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/impact">Impact approach</Link>
          </Button>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-3xl border bg-slate-50 p-8">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold md:text-2xl">Ready to partner?</h2>
            <p className="text-slate-600">
              If you’re running a clinic, NGO program, or donor-funded initiative, NutriCare can support your
              nutrition and health outcomes.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button asChild>
              <Link href="/register">Start a pilot</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/learn">Explore resources</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
