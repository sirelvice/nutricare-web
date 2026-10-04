"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Interest = "pilot" | "donation" | "research" | "integration" | "other";

const interests: { value: Interest; label: string; hint: string }[] = [
  { value: "pilot", label: "Pilot programme", hint: "Deploy NutriCare for a group/site" },
  { value: "donation", label: "Funding / donation", hint: "Support development or rollout" },
  { value: "research", label: "Research collaboration", hint: "Evaluation and outcomes" },
  { value: "integration", label: "Integration", hint: "Connect with existing systems" },
  { value: "other", label: "Other", hint: "Tell us what you need" },
];

export default function PartnersPage() {
  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [interest, setInterest] = useState<Interest>("pilot");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const valid = useMemo(() => {
    if (!orgName.trim()) return false;
    if (!contactName.trim()) return false;
    if (!email.trim() || !email.includes("@")) return false;
    if (!message.trim() || message.trim().length < 10) return false;
    return true;
  }, [orgName, contactName, email, message]);

  async function onSubmit() {
    if (!valid || submitting) return;

    setSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/partners/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgName: orgName.trim(),
          contactName: contactName.trim(),
          email: email.trim(),
          country: country.trim() || undefined,
          interest,
          message: message.trim(),
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | { ok?: boolean; id?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data && "error" in data && data.error
            ? data.error
            : "Unable to submit your inquiry.",
        );
      }

      setStatus({
        type: "success",
        text: "Inquiry submitted successfully.",
      });

      setOrgName("");
      setContactName("");
      setEmail("");
      setCountry("");
      setInterest("pilot");
      setMessage("");
    } catch (error) {
      setStatus({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to submit your inquiry.",
      });
    } finally {
      setSubmitting(false);
    }
  }

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
            Personal nutrition data is handled with appropriate access controls, while
            reporting can be shaped around the needs of a programme or partner.
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

      <section className="grid gap-6 md:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="space-y-2 border-b border-slate-100 pb-6">
            <CardTitle className="text-xl text-slate-950">Start a conversation</CardTitle>
            <p className="text-sm leading-6 text-slate-500">
              A little context helps us understand what you are looking to explore.
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                <Label htmlFor="org">Organisation</Label>
                <Input
                  id="org"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Community Health Org"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Contact name</Label>
                <Input
                  id="name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@org.org"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country (optional)</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Kenya"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Interested in</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {interests.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setInterest(opt.value)}
                    disabled={submitting}
                    className={[
                      "rounded-2xl border p-4 text-left transition hover:border-slate-300 hover:bg-slate-50",
                      interest === opt.value
                        ? "border-slate-900 bg-slate-50 shadow-sm"
                        : "border-slate-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="text-sm font-semibold">{opt.label}</div>
                    <div className="text-xs text-slate-600">{opt.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="msg">Message</Label>
              <textarea
                id="msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[160px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Tell us about your programme, audience, and what you would like to explore."
                disabled={submitting}
              />
            </div>

            <Button onClick={onSubmit} disabled={!valid || submitting}>
              {submitting ? "Submitting..." : "Submit inquiry"}
            </Button>

            {status && (
              <p
                className={`text-sm ${
                  status.type === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {status.text}
              </p>
            )}

            {!valid && !status ? (
              <p className="text-xs text-slate-500">
                Fill organisation, contact, valid email, and a short message
                (10+ characters).
              </p>
            ) : null}
            </div>
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
                Personal and programme-oriented reporting
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
