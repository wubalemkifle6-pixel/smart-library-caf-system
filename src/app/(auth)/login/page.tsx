
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Mail, Lock, Coffee, AlertCircle } from "lucide-react";
import { Button, Input, Card, CardBody, showToast } from "@/components/ui";
import { useAuth } from "@/components/Providers";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(loginInput, password);

      if (result.success) {
        showToast("Login successful!", "success");
        router.push(result.redirect || "/");
      } else {
        setError(result.message || "Login failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="min-h-screen bg-black flex items-center justify-center">


      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">

        <div className="w-full max-w-md">

          {/* MOBILE BRANDING */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>

            <div>
              <div className="font-bold text-lg font-['Playfair_Display'] text-navy-900">
                Smart Library
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Coffee size={10} /> Book Café
              </div>
            </div>
          </div>

          <Card>
            <CardBody className="p-8">

              <h1 className="text-2xl font-bold text-slate-900">
                Welcome back
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Sign in to your account
              </p>

              {/* ERROR MESSAGE */}
              {error && (
                <div className="mt-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* LOGIN FORM */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">

                <Input
                  label="Email or Username"
                  type="text"
                  required
                  icon={<Mail size={16} />}
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="you@example.com"
                />

                <Input
                  label="Password"
                  type="password"
                  required
                  icon={<Lock size={16} />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                    />
                    Remember me
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-navy-700 hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={loading}
                >
                  Sign In
                </Button>

              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="text-navy-700 font-medium hover:underline"
                >
                  Sign up
                </Link>
              </p>

            </CardBody>
          </Card>

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/" className="hover:text-navy-700">
              ← Back to home
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
