import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InquiryForm } from "@/components/public/InquiryForm";

export default function ContactPage() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-6 py-10 shadow-sm sm:px-10 lg:py-14">
        <div className="relative max-w-3xl space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Contact</Badge>
            <Badge variant="secondary">Support</Badge>
            <Badge variant="secondary">Partnerships</Badge>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">
              We are here to help
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Let&apos;s talk about what you need.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Have a question about NutriCare, need help with the product, or want to discuss a
              partnership? Send us a message and tell us what you are working on.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="space-y-2 border-b border-slate-100 pb-6">
            <CardTitle className="text-xl text-slate-950">Send a message</CardTitle>
            <p className="text-sm leading-6 text-slate-500">
              Share enough detail for us to understand your question and respond appropriately.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <InquiryForm kind="contact" />
          </CardContent>
        </Card>

        <aside className="space-y-6">
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg text-slate-950">Support</CardTitle>
              <p className="text-sm leading-6 text-slate-500">
                Questions about using NutriCare or something that is not working as expected?
              </p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-slate-600">Use the form for product support. Include the page, what you tried and what happened.</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-slate-950 text-white shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg text-white">Partnerships</CardTitle>
              <p className="text-sm leading-6 text-slate-300">
                Exploring a pilot, programme, outcome reporting, or a deployment?
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-slate-300">
                Tell us about your organisation, the people you serve, and what you would like to
                explore.
              </p>
              <Link
                href="/partners"
                className="inline-flex text-sm font-medium text-white underline decoration-slate-500 underline-offset-4 transition hover:decoration-white"
              >
                Explore partnerships
              </Link>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}