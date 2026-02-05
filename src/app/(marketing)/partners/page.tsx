"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loadInquiries, saveInquiry, type PartnerInquiry } from "@/lib/partners/inquiries";

type Interest = PartnerInquiry["interest"];

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

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

  const [sent, setSent] = useState(false);

  const inquiries = useMemo(() => loadInquiries(), []);

  const valid = useMemo(() => {
    if (!orgName.trim()) return false;
    if (!contactName.trim()) return false;
    if (!email.trim() || !email.includes("@")) return false;
    if (!message.trim() || message.trim().length < 10) return false;
    return true;
  }, [orgName, contactName, email, message]);

  function onSubmit() {
    if (!valid) return;

    saveInquiry({
      orgName: orgName.trim(),
      contactName: contactName.trim(),
      email: email.trim(),
      country: country.trim() ? country.trim() : undefined,
      interest,
      message: message.trim(),
    });

    setSent(true);
    setTimeout(() => setSent(false), 1500);

    setOrgName("");
    setContactName("");
    setEmail("");
    setCountry("");
    setInterest("pilot");
    setMessage("");
  }

  function exportInquiries() {
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    download(`nutricare-partner-inquiries-${ts}.json`, JSON.stringify(inquiries, null, 2));
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
          NutriCare is a privacy-first nutrition intelligence platform built for individuals and programmes.
          We support pilots with exportable reporting and a clear impact model.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/impact">View impact model</Link>
          </Button>
          <Button onClick={exportInquiries} variant="outline" disabled={inquiries.length === 0}>
            Export inquiries (JSON)
          </Button>
        </div>

        {inquiries.length > 0 ? (
          <p className="text-xs text-slate-500">
            Stored inquiries on this device: <span className="font-medium">{inquiries.length}</span>
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Pilot-ready</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Tools for screening + trend tracking, designed to be explainable and easy to deploy.
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Privacy-first</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            MVP stores data locally. Backend phase adds secure accounts and aggregated reporting.
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Exportable reporting</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            JSON exports today; PDF and dashboards later — built for donor/partner workflows.
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
                <Input id="org" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Community Health Org" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Contact name</Label>
                <Input id="name" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Jane Doe" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@org.org" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country (optional)</Label>
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Kenya" />
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
                    className={[
                      "rounded-2xl border p-3 text-left",
                      interest === opt.value ? "border-slate-900 bg-slate-50" : "hover:bg-slate-50",
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
                className="min-h-[120px] w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Tell us about your programme, audience size, and what you want to measure."
              />
              <p className="text-xs text-slate-500">
                We’ll later connect this to email + database. For now it saves locally on your device.
              </p>
            </div>

            <Button onClick={onSubmit} disabled={!valid}>
              {sent ? "Saved ✓" : "Submit inquiry"}
            </Button>
            {!valid ? (
              <p className="text-xs text-slate-500">
                Fill organisation, contact, valid email, and a short message (10+ chars).
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
              <li>Clear pilot plan: screening + education + tracking</li>
              <li>Exportable reporting snapshot for donors</li>
              <li>Privacy-first approach suitable for sensitive contexts</li>
              <li>Future: aggregated dashboards + site-level reporting</li>
            </ul>

            <div className="rounded-2xl border bg-white p-4">
              <div className="font-semibold">Next backend step</div>
              <p className="mt-1 text-slate-600">
                Add secure sign-in, store profiles & history in a database, and generate aggregate reports per site.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
