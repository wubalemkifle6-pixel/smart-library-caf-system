"use client";
import { useState } from "react";
import { Card, CardBody, Button, Input, Textarea, showToast } from "@/components/ui";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).then(r => r.json());
      if (res.success) {
        setSent(true);
        setForm({ name: "", email: "", subject: "", message: "" });
        showToast("Message sent! We'll get back to you soon.", "success");
      } else {
        showToast(res.error || "Failed to send message", "error");
      }
    } catch {
      showToast("Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl lg:text-5xl font-bold font-['Playfair_Display'] text-navy-900">Get in Touch</h1>
        <p className="mt-4 text-lg text-slate-600">
          Have a question, suggestion, or want to book a group visit? We'd love to hear from you.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          {[
            { icon: MapPin, title: "Address", content: "123 Library Lane, Booktown, BK 10001", color: "bg-navy-100 text-navy-700" },
            { icon: Phone, title: "Phone", content: "+1 (555) 123-LIBS (5427)", color: "bg-emerald-100 text-emerald-700" },
            { icon: Mail, title: "Email", content: "hello@smartlibrary.cafe", color: "bg-amber-100 text-amber-700" },
            { icon: Clock, title: "Opening Hours", content: "Mon-Fri: 7am-10pm\nSat-Sun: 8am-11pm", color: "bg-purple-100 text-purple-700" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.title}>
                <CardBody className="flex gap-4 items-start">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${c.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{c.title}</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-line mt-1">{c.content}</p>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <Card className="lg:col-span-2">
          <CardBody className="p-8">
            <h2 className="text-2xl font-bold text-navy-900 font-['Playfair_Display'] mb-6">Send us a message</h2>
            {sent && (
              <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                Thank you for your message! We've received it and will respond within 24 hours.
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Your Name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                />
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <Input
                label="Subject"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="How can we help?"
              />
              <Textarea
                label="Message"
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Type your message here..."
                rows={6}
              />
              <Button type="submit" size="lg" loading={sending} className="w-full md:w-auto">
                <Send size={16} /> Send Message
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
