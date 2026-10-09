"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data?.error ?? "Unable to process the password reset request.",
        );
      }

      setSubmitted(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to process the password reset request.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Forgot Password?"
      description="Request a link to reset your NutriCare password."
      footer={
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to sign in
        </Link>
      }
    >
      {!submitted ? (
        <form onSubmit={onSubmit} className="space-y-5" aria-busy={busy}>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              aria-describedby="recovery-help"
              className="h-12"
              disabled={busy}
              required
            />
            <p id="recovery-help" className="text-xs leading-5 text-muted-foreground">
              If an account exists for this email, we&apos;ll send password reset instructions.
            </p>
          </div>

          {error ? <AuthMessage type="error">{error}</AuthMessage> : null}

          <Button
            type="submit"
            className="h-12 w-full text-base font-medium"
            disabled={busy || !email.trim()}
          >
            {busy ? "Sending instructions..." : "Send reset instructions"}
          </Button>
        </form>
      ) : (
        <div className="space-y-5">
          <AuthMessage type="success">
            <h2 className="font-semibold">Check your email</h2>
            <p className="mt-1">
              If an account exists with{" "}
              <strong className="break-all">{email.trim()}</strong>, you will
              receive password reset instructions shortly.
            </p>
          </AuthMessage>
          <p className="text-sm leading-6 text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
          <Button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setEmail("");
              setError("");
            }}
            variant="outline"
            className="min-h-11 w-full"
          >
            Try another email
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
