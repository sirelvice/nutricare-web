"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Leaf, ShieldCheck } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();

  const registered = sp.get("registered") === "1";
  const nextUrl = sp.get("next"); // Get the intended destination from proxy

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const isValid = useMemo(() => {
    const e = email.trim().toLowerCase();
    return e.includes("@") && e.length > 5 && password.length >= 6;
  }, [email, password]);

  // Redirect to intended page after successful login
  const handleSuccessfulLogin = () => {
    setMsg({ type: "success", text: "Welcome back! Redirecting..." });

    setTimeout(() => {
      if (nextUrl && nextUrl.startsWith("/")) {
        router.push(nextUrl);           // Go back to the protected page user tried to visit
      } else {
        router.push("/dashboard");      // Default fallback
      }
    }, 800);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || busy) return;

    setBusy(true);
    setMsg(null);

    const res = await signIn("credentials", {
      redirect: false,
      email: email.trim().toLowerCase(),
      password,
    });

    setBusy(false);

    if (!res || res.error) {
      setMsg({ type: "error", text: "Invalid email or password. Please try again." });
      return;
    }

    handleSuccessfulLogin();
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

        {/* Success banner after registration */}
        {registered && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <span>Account created successfully. You can now sign in.</span>
          </div>
        )}

        <Card className="rounded-3xl shadow-xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="space-y-1 pb-8 pt-8">
            <CardTitle className="text-2xl font-semibold text-center text-slate-900">
              Welcome back
            </CardTitle>
            <p className="text-center text-slate-600 text-sm">
              Sign in to access your personalized nutrition plan
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
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
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
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
              >
                Create free account
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