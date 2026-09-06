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
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                <Label htmlFor="phone">Phone (optional)</Label>
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
                  placeholder="How can we help?"
                  className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500">
                  Your message is submitted securely and stored for follow-up.
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

        <div className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">Support</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>Email: <span className="font-medium text-slate-900">support@nutricare.app</span></p>
              <p>Hours: Mon–Fri, 9am–5pm</p>
              <p className="text-xs text-slate-500">
                Support inquiries are handled through the NutriCare contact channel.
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
                For programme and impact discussions, use the partner inquiry form.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}