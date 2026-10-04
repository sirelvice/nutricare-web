import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-20">
      <section className="space-y-4 text-center">
        <Badge variant="secondary">NutriCare</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">
          The core NutriCare experience is free.
        </h1>
        <p className="mx-auto max-w-2xl text-slate-600">
          Create your profile, get a nutrition plan, track your weight, understand
          your progress, and receive plan adjustments without a subscription.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Personal nutrition journey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Assessment and goal selection.</p>
            <p>Personalized calorie and macro targets.</p>
            <p>Weight tracking and progress evaluation.</p>
            <p>Plan-versioned adjustments when your progress calls for them.</p>
            <p>Personal reports and history.</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Future products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              Additional products may be introduced later as NutriCare develops
              validated capabilities for clinicians, programmes, and organizations.
            </p>
            <p>There is no payment or subscription requirement today.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
