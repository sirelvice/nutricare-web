"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || success) return;

    if (!token) {
      setError("This password reset link is invalid.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to reset your password.");
      }

      setSuccess(true);
      setPassword("");
      setConfirmation("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to reset your password.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Reset Password"
      description="Choose a new password for your NutriCare account."
      footer={
        !success ? (
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to sign in
          </Link>
        ) : null
      }
    >
      {success ? (
        <div className="space-y-5">
          <AuthMessage type="success">
            Your password has been reset successfully.
          </AuthMessage>
          <Button asChild className="h-12 w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" aria-busy={busy}>
          {!token ? (
            <AuthMessage type="error">
              This password reset link is invalid.
            </AuthMessage>
          ) : null}

          <PasswordField
            id="password"
            label="New password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={8}
            disabled={busy || !token}
          />

          <PasswordField
            id="confirmation"
            label="Confirm password"
            value={confirmation}
            onChange={setConfirmation}
            autoComplete="new-password"
            minLength={8}
            disabled={busy || !token}
          />

          {error ? <AuthMessage type="error">{error}</AuthMessage> : null}

          <Button
            type="submit"
            className="h-12 w-full text-base font-medium"
            disabled={busy || !token}
          >
            {busy ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
