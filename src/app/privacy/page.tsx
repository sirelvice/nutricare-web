import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Privacy-first</Badge>
          <Badge variant="secondary">Minimal data</Badge>
          <Badge variant="secondary">Partner-ready</Badge>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Privacy Policy
        </h1>

        <p className="text-slate-600">
          NutriCare is designed to collect the minimum needed to deliver useful nutrition insights.
          This page explains what we collect, how we use it, and your choices.
        </p>
      </div>

      {/* Content */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">What we collect</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              Profile fields you enter (e.g. height, age, goal, activity), plus any entries you add
              for tracking (e.g. weight history).
            </p>
            <p>
              We don’t need your real name to run NutriCare. If you add a name, it’s optional.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">How we use it</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              To calculate metrics (BMI, BMR/TDEE), personalize guidance, and show your progress over time.
            </p>
            <p>
              We don’t sell your personal data. We don’t use it for third-party advertising.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Sharing & reporting</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              Partner reporting (when enabled) should be aggregated and privacy-preserving.
              Individual-level details should not be shared without explicit consent.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Your choices</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              You control what you enter. You can update your profile any time.
            </p>
            <p>
              Questions? Reach us via the{" "}
              <Link href="/contact" className="underline text-slate-900">
                Contact page
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-3xl border bg-slate-50 p-6 text-sm text-slate-600">
        <div className="font-semibold text-slate-900">Note</div>
        <p className="mt-2">
          NutriCare provides general wellness tools and education. It doesn’t replace professional medical advice.
        </p>
      </div>
    </div>
  );
}
