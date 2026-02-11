"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type ApiRes = { ok: true } | { ok: false; error: string };

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const valid = useMemo(() => {
    const e = email.trim().toLowerCase();
    if (!e.includes("@") || e.length < 6) return false;
    if (password.length < 8) return false;
    return true;
  }, [email, password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;

    setBusy(true);
    setMsg(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const json = (await res.json()) as ApiRes;
      if (!res.ok || !json.ok) {
        setMsg(!json.ok ? json.error : "Registration failed.");
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setMsg("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="text-slate-600">Start tracking your nutrition tools in NutriCare.</p>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
              <p className="text-xs text-slate-500">We’ll add password reset later.</p>
            </div>

            {msg ? <p className="text-sm text-red-600">{msg}</p> : null}

            <Button type="submit" className="w-full" disabled={!valid || busy}>
              {busy ? "Creating..." : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-slate-900 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
