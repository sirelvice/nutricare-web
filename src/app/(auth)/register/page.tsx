"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { PasswordField } from "@/components/auth/PasswordField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type ApiRes =
  | { ok: true; message: string }
  | { ok?: false; error: string };

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const isValid = useMemo(() => {
    const trimmedEmail = email.trim().toLowerCase();
    return (
      name.trim().length >= 2 &&
      trimmedEmail.includes("@") &&
      trimmedEmail.length > 5 &&
      password.length >= 8
    );
  }, [name, email, password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || busy) return;

    setBusy(true);
    setMsg(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const json = (await res.json()) as ApiRes;

      if (!res.ok) {
        setMsg({
          type: "error",
          text: !json.ok
            ? json.error
            : "Registration failed. Please try again.",
        });
        return;
      }

      if (!json.ok) {
        setMsg({
          type: "error",
          text: json.error,
        });
        return;
      }

      setMsg({
        type: "success",
        text: "Registration received. Redirecting to sign in...",
      });

      setTimeout(() => {
        router.push("/login?registered=1");
      }, 1200);
    } catch {
      setMsg({
        type: "error",
        text: "Network error. Please check your connection and try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      description="Start building a nutrition plan around your goals."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" aria-busy={busy}>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your full name"
            autoComplete="name"
            className="h-12"
            disabled={busy}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="h-12"
            disabled={busy}
            required
          />
        </div>

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="Minimum 8 characters"
          minLength={8}
          disabled={busy}
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
                className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground motion-reduce:animate-none"
                aria-hidden="true"
              />
              Creating account...
            </span>
          ) : (
            "Create free account"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
