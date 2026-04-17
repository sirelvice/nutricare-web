"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Leaf, ShieldCheck } from "lucide-react";

type ApiRes = { ok: true } | { ok: false; error: string };

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const isValid = useMemo(() => {
    const e = email.trim().toLowerCase();
    return e.includes("@") && e.length > 5 && password.length >= 8;
  }, [email, password]);

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
          email: email.trim().toLowerCase(), 
          password 
        }),
      });

      const json = (await res.json()) as ApiRes;

      if (!res.ok || !json.ok) {
        setMsg({ 
          type: "error", 
          text: json.error || "Registration failed. Please try again." 
        });
        return;
      }

      // Success
      setMsg({ 
        type: "success", 
        text: "Account created successfully! Redirecting to login..." 
      });

      setTimeout(() => {
        router.push("/login?registered=1");
      }, 1200);

    } catch (err) {
      setMsg({ 
        type: "error", 
        text: "Network error. Please check your connection and try again." 
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header with Brand */}
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
              Create your account
            </CardTitle>
            <p className="text-center text-slate-600 text-sm">
              Start your journey to better nutrition today
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 rounded-2xl"
                  disabled={busy}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="h-12 rounded-2xl pr-12"
                    disabled={busy}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-slate-500">Password reset will be available soon.</p>
              </div>

              {msg && (
                <div
                  className={`text-sm p-3 rounded-2xl ${
                    msg.type === "error"
                      ? "bg-red-50 text-red-700 border border-red-100"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  }`}
                >
                  {msg.text}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium rounded-2xl bg-emerald-600 hover:bg-emerald-700 transition-all active:scale-[0.985]"
                disabled={!isValid || busy}
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  "Create free account"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Trust signals */}
        <p className="text-center text-xs text-slate-500">
          Your data is secure • End-to-end encrypted
        </p>
      </div>
    </div>
  );
}