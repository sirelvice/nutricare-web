import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { impactNarrative, impactMeasures } from "@/lib/impact/config";

export const metadata = {
  title: "Impact",
  description: "NutriCare's approach to evaluating product use and programme outcomes.",
};

export default function ImpactPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 sm:p-10 lg:p-12">
        <p className="text-sm font-medium text-primary">Impact</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{impactNarrative.title}</h1>
        {impactNarrative.body.map((text) => (
          <p key={text} className="max-w-3xl text-base leading-7 text-muted-foreground">{text}</p>
        ))}
      </section>

      <section aria-label="Impact evidence" className="rounded-2xl border bg-muted/40 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Programme evidence</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          No verified programme totals or health outcomes are published here yet.
          Any future results should identify the period, participants, method and limitations.
        </p>
      </section>

      <section aria-label="Evaluation approach" className="grid items-start gap-4 md:grid-cols-3">
        {impactMeasures.map((measure) => (
          <Card key={measure.title}>
            <CardHeader><CardTitle className="text-lg">{measure.title}</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc space-y-3 pl-5 text-sm leading-6 text-muted-foreground">
                {measure.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 sm:p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Discuss an evaluation</h2>
          <p className="text-sm text-muted-foreground">Start with the people, goals and evidence you need.</p>
        </div>
        <Button asChild variant="outline"><Link href="/partners">Explore partnerships</Link></Button>
      </section>
    </div>
  );
}
