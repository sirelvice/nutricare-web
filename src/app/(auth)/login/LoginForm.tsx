"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { isSafeLoginPath } from "@/lib/security/login-redirect";
import { PasswordField } from "@/components/auth/PasswordField";

import { AuthMessage } from "@/components/auth/AuthMessage";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
  const sp = useSearchParams();

  const registered = sp.get("registered") === "1";

  // Safely decode the "next" URL from proxy (with error handling)
  const nextUrlRaw = sp.get("next");
  let nextUrl: string | null = null;

  if (nextUrlRaw) {
    try {
      nextUrl = decodeURIComponent(nextUrlRaw);
    } catch {
      nextUrl = null;
    }
  }

  // Safe path validation to prevent open redirects
  const isSafePath = (url: string): boolean => {
    return isSafeLoginPath(url);
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submissionInFlight = useRef(false);
  const [msg, setMsg] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const isValid = useMemo(() => {
    const e = email.trim().toLowerCase();
    return e.includes("@") && e.length > 5 && password.length >= 6;
  }, [email, password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submissionInFlight.current) return;
    submissionInFlight.current = true;
    let leavingPage = false;

    setBusy(true);
    setMsg(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (!res || res.error) {
        setMsg({
          type: "error",
          text: "Invalid email or password. Please try again.",
        });
        return;
      }

      setMsg({ type: "success", text: "Welcome back. Redirecting..." });
      const target = nextUrl && isSafePath(nextUrl) ? nextUrl : "/dashboard";
      // Start a fresh document using the authenticated cookie instead of reusing
      // a route that may have been prefetched while signed out.
      window.location.replace(target);
      leavingPage = true;
    } catch {
      setMsg({
        type: "error",
        text: "Unable to sign in right now. Please try again.",
      });
    } finally {
      if (!leavingPage) {
        submissionInFlight.current = false;
        setBusy(false);
      }
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue your NutriCare journey."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create free account
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        {registered ? (
          <AuthMessage type="success">
            Registration request received. Sign in with your password. If you already have an account, use your existing password or reset it.
          </AuthMessage>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12"
              autoComplete="email"
              disabled={busy}
              required
            />
          </div>

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            disabled={busy}
            labelAction={
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            }
          />

          {msg ? (
            <AuthMessage type={msg.type}>{msg.text}</AuthMessage>
          ) : null}

          <Button
            type="submit"
            className="h-12 w-full text-base font-medium"
            disabled={!isValid || busy}
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <span
                  className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                  aria-hidden="true"
                />
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
