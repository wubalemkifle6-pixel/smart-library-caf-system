"use client";
import { useState } from "react";
import Link from "next/link";
import { BookOpen, Mail, Coffee, ArrowLeft } from "lucide-react";
import { Button, Input, Card, CardBody, showToast } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
      showToast("If the email exists, reset instructions have been sent.", "success");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
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
            <Link href="/login" className="inline-flex items-center gap-1 text-sm text-navy-700 hover:underline mb-4">
              <ArrowLeft size={14} /> Back to login
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Forgot your password?</h1>
            <p className="text-sm text-slate-500 mt-1">Enter your email and we'll send you reset instructions.</p>

            {sent ? (
              <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                If that email address is registered, you'll receive reset instructions shortly.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  required
                  icon={<Mail size={16} />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <Button type="submit" size="lg" className="w-full" loading={loading}>
                  Send Reset Link
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
