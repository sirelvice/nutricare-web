"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const registered = sp.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const valid = useMemo(() => {
    const e = email.trim().toLowerCase();
    if (!e.includes("@") || e.length < 6) return false;
    if (password.length < 1) return false;
    return true;
  }, [email, password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;

    setBusy(true);
    setMsg(null);

    const res = await signIn("credentials", {
      redirect: false,
      email: email.trim().toLowerCase(),
      password,
    });

    setBusy(false);

    if (!res || res.error) {
      setMsg("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-slate-600">Sign in to continue.</p>
      </div>

      {registered ? (
        <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">
          Account created ✓ You can now sign in.
        </div>
      ) : null}

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {msg ? <p className="text-sm text-red-600">{msg}</p> : null}

            <Button type="submit" className="w-full" disabled={!valid || busy}>
              {busy ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            No account yet?{" "}
            <Link href="/register" className="font-medium text-slate-900 hover:underline">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
