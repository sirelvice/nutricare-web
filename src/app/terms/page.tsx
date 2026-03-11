import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Terms</Badge>
          <Badge variant="secondary">Responsible use</Badge>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Terms of Use
        </h1>

        <p className="text-slate-600">
          These terms help keep NutriCare safe and clear for users and partners. By using the app, you agree to them.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">What NutriCare is</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              NutriCare provides nutrition education and calculation tools (e.g. BMI, calories) for general guidance.
            </p>
            <p>
              It is not medical diagnosis or treatment. If you have concerns, consult a qualified professional.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Accounts & security</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              You’re responsible for your account credentials and activity on your account.
            </p>
            <p>
              If you suspect unauthorized access, change your password and contact us.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Acceptable use</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>Don’t abuse, scrape, or attempt to disrupt the service.</p>
            <p>Don’t upload harmful content or attempt to access data that isn’t yours.</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Contact</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              Questions about these terms? Use our{" "}
              <Link href="/contact" className="underline text-slate-900">
                Contact page
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-3xl border bg-slate-50 p-6 text-sm text-slate-600">
        <div className="font-semibold text-slate-900">Changes</div>
        <p className="mt-2">
          We may update these terms as NutriCare evolves. Updates will be posted on this page.
        </p>
      </div>
    </div>
  );
}
