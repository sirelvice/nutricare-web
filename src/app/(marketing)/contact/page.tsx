"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ContactPage() {
  // ── Form state ──────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Submit handler ──────────────────────────────────────────────────────────
  async function onSubmit() {
    setStatus(null);
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus({
          type: "error",
          text: json.error ?? "Failed to send message.",
        });
        return;
      }

      setStatus({
        type: "success",
        text: "Message sent successfully ✓",
      });

      // Clear form after success
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setStatus({
        type: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 py-10">
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

      <section className="grid gap-6 md:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="space-y-2 border-b border-slate-100 pb-6">
            <CardTitle className="text-xl text-slate-950">Send a message</CardTitle>
            <p className="text-sm leading-6 text-slate-500">
              Share enough detail for us to understand your question and respond appropriately.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone <span className="font-normal text-slate-400">(optional)</span></Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 ..."
                  inputMode="tel"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us how we can help."
                  className="min-h-[160px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500">
                  Your message is stored so the NutriCare team can follow up.
                </p>
              </div>

              <Button
                type="button"
                onClick={onSubmit}
                disabled={loading}
                className="w-full md:w-auto"
              >
                {loading ? "Sending..." : "Send message"}
              </Button>

              {status && (
                <p
                  className={`text-sm mt-2 ${
                    status.type === "success" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {status.text}
                </p>
              )}
            </div>
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
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
                <p className="mt-1 font-medium text-slate-950">support@nutricare.app</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Hours</p>
                <p className="mt-1 text-slate-700">Monday to Friday, 9am to 5pm</p>
              </div>
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
              <a
                href="/partners"
                className="inline-flex text-sm font-medium text-white underline decoration-slate-500 underline-offset-4 transition hover:decoration-white"
              >
                Explore partnerships
              </a>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}