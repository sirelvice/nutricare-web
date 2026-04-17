"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Leaf, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;

    setBusy(true);

    // Simulate API call (we'll implement real logic later)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setSubmitted(true);
    setBusy(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">NutriCare</h1>
          </div>
          <p className="text-slate-600 max-w-xs">
            Personalized nutrition guidance for better health
          </p>
        </div>

        <Card className="rounded-3xl shadow-xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="space-y-1 pb-8 pt-8">
            <CardTitle className="text-2xl font-semibold text-center text-slate-900">
              Forgot Password?
            </CardTitle>
            <p className="text-center text-slate-600 text-sm">
              No worries. We'll help you reset it.
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {!submitted ? (
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-12 rounded-2xl pl-11"
                      disabled={busy}
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    We'll send password reset instructions to this email.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium rounded-2xl bg-emerald-600 hover:bg-emerald-700 transition-all active:scale-[0.985]"
                  disabled={busy || !email.trim()}
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending instructions...
                    </span>
                  ) : (
                    "Send reset instructions"
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Check your email</h3>
                <p className="text-slate-600">
                  If an account exists with <strong>{email}</strong>, you will receive password reset instructions shortly.
                </p>
                <p className="text-sm text-slate-500">
                  Didn't receive the email? Check your spam folder or try again.
                </p>

                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                  }}
                  variant="outline"
                  className="mt-6 rounded-2xl"
                >
                  Try another email
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </div>

        {/* Trust signals */}
        <p className="text-center text-xs text-slate-500">
          Your data is secure • End-to-end encrypted
        </p>
      </div>
    </div>
  );
}