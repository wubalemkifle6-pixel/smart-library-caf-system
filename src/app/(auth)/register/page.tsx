"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, User, Mail, Lock, Phone, Coffee } from "lucide-react";
import { Button, Input, Card, CardBody, showToast } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          username: form.username,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      }).then(r => r.json());
      if (res.success) {
        setSubmitted(true);
        showToast("Registration successful! Please wait for approval.", "success");
      } else {
        showToast(res.error || "Registration failed", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg font-['Playfair_Display'] text-navy-900">Smart Library</div>
            <div className="text-xs text-slate-500 flex items-center gap-1"><Coffee size={10} /> Book Café</div>
          </div>
        </div>

        <Card>
          <CardBody className="p-8">
            {submitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Registration Submitted!</h2>
                <p className="mt-3 text-slate-600">
                  Thank you for signing up! Your membership is pending administrator approval.
                  You will be able to log in once your account has been approved.
                </p>
                <div className="mt-6">
                  <Link href="/login">
                    <Button>Go to Login</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
                <p className="text-sm text-slate-500 mt-1">Join our community of book lovers</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      required
                      icon={<User size={16} />}
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      placeholder="John Doe"
                    />
                    <Input
                      label="Username"
                      required
                      value={form.username}
                      onChange={(e) => update("username", e.target.value)}
                      placeholder="johndoe"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Email"
                      type="email"
                      required
                      icon={<Mail size={16} />}
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="you@example.com"
                    />
                    <Input
                      label="Phone (optional)"
                      icon={<Phone size={16} />}
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="+1 555 123 4567"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Password"
                      type="password"
                      required
                      icon={<Lock size={16} />}
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="Min. 6 characters"
                      error={errors.password}
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      required
                      icon={<Lock size={16} />}
                      value={form.confirmPassword}
                      onChange={(e) => update("confirmPassword", e.target.value)}
                      placeholder="Repeat password"
                      error={errors.confirmPassword}
                    />
                  </div>
                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                    By registering, your account will be submitted for administrator approval. You will not be able to access member features until approved.
                  </div>
                  <Button type="submit" size="lg" className="w-full" loading={loading}>
                    Create Account
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-navy-700 font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </CardBody>
        </Card>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="hover:text-navy-700">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
