import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 py-10">
      {/* Header */}
      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Contact</Badge>
          <Badge variant="secondary">Support</Badge>
          <Badge variant="secondary">Partners</Badge>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Contact us
        </h1>

        <p className="max-w-3xl text-slate-600">
          NutriCare helps people understand nutrition with clear tools and responsible reporting.
          Reach out for support, feedback, or partnership discussions.
        </p>
      </section>

      {/* Body */}
      <section className="grid gap-6 md:grid-cols-[1fr_380px]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Send a message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="you@example.com" inputMode="email" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" placeholder="+254 ..." inputMode="tel" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="How can we help?"
              />
              <p className="text-xs text-slate-500">
                (MVP note: this form is UI-only for now. Next sprint we’ll wire it to an API + email.)
              </p>
            </div>

            <Button type="button" className="w-full md:w-auto">
              Send message
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">Support</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>Email: <span className="font-medium text-slate-900">support@nutricare.app</span></p>
              <p>Hours: Mon–Fri, 9am–5pm</p>
              <p className="text-xs text-slate-500">
                Replace with your real email when you’re ready.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">Partners</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>
                For pilots, outcome reporting, or deployments, reach out and we’ll share the partner brief.
              </p>
              <p className="text-xs text-slate-500">
                Tip: we’ll later connect this to the “Impact Snapshot” export.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
