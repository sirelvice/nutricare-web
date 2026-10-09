import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InquiryForm } from "@/components/public/InquiryForm";

export default function PartnersPage() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-6 py-10 shadow-sm sm:px-10 lg:py-14">
        <div className="relative max-w-3xl space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Partners</Badge>
            <Badge variant="secondary">Pilots</Badge>
            <Badge variant="secondary">Reporting</Badge>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">
              Explore what we could build together
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Partner with NutriCare.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Exploring a pilot, research collaboration, integration, or programme
              deployment? Tell us what you are working on and what you want to achieve.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href="/impact">View impact model</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-3xl border-slate-200 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-semibold text-emerald-700">
              01
            </div>
            <CardTitle className="text-lg text-slate-950">Pilot and programme use</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-600">
            Explore screening, education, and tracking workflows that can be adapted to a
            specific programme or use case.
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-sm font-semibold text-amber-700">
              02
            </div>
            <CardTitle className="text-lg text-slate-950">Privacy-conscious by design</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-600">
            Account records support personal use today. Any programme data sharing needs
            agreed access rules, safeguards and a clear purpose.
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
              03
            </div>
            <CardTitle className="text-lg text-slate-950">Reporting</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-600">
            Personal reporting is available today, while programme and aggregate
            reporting can evolve as partner requirements are validated.
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="space-y-2 border-b border-slate-100 pb-6">
            <CardTitle className="text-xl text-slate-950">Start a conversation</CardTitle>
            <p className="text-sm leading-6 text-slate-500">
              A little context helps us understand what you are looking to explore.
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <InquiryForm kind="partner" />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-slate-950 text-white shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg text-white">Areas we can explore</CardTitle>
            <p className="text-sm leading-6 text-slate-300">
              Partnership conversations can start with a clear use case, audience, and intended outcome.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-slate-200">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Screening, education, and tracking workflows
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Personal reports and future programme requirements
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Appropriate handling of sensitive nutrition data
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Future programme and site-level capabilities as requirements are validated
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
