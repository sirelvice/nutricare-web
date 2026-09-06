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
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Partners</Badge>
          <Badge variant="secondary">Pilots</Badge>
          <Badge variant="secondary">Reporting</Badge>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Partner with NutriCare
        </h1>

        <p className="max-w-3xl text-slate-600">
          NutriCare is a privacy-first nutrition intelligence platform built for
          individuals and programmes. We support pilots with explainable tools,
          reporting, and a clear impact model.
        </p>

        <Button asChild variant="outline">
          <Link href="/impact">View impact model</Link>
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Pilot-ready</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Tools for screening, education, and trend tracking designed to be
            explainable and practical to deploy.
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Privacy-first</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Personal user data is stored securely in the NutriCare backend, with
            reporting designed around appropriate access boundaries.
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Reporting</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Personal reporting is available today, while programme and aggregate
            reporting can evolve as partner requirements are validated.
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Partner inquiry</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
                      "rounded-2xl border p-3 text-left",
                      interest === opt.value
                        ? "border-slate-900 bg-slate-50"
                        : "hover:bg-slate-50",
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
                className="min-h-[120px] w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
                placeholder="Tell us about your programme, audience size, and what you want to measure."
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
          </CardContent>
        </Card>

        <Card className="rounded-3xl border bg-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">What partners get</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <ul className="list-disc space-y-2 pl-5">
              <li>Clear pilot plan: screening, education, and tracking</li>
              <li>Explainable personal and programme-oriented reporting</li>
              <li>Privacy-first handling of sensitive nutrition data</li>
              <li>Future programme and site-level capabilities as validated</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
