"use client";
import { Card, CardBody } from "@/components/ui";
import { Shield, BookOpen, Users, Coffee, CreditCard, LucideIcon } from "lucide-react";
import { ROLE_INFO } from "@/lib/utils";
import { useMemo } from "react";

const iconMap: Record<string, LucideIcon> = {
  Shield, BookOpen, Users, Coffee, CreditCard,
};

export default function ActorsPage() {
  const roles = useMemo(() => Object.entries(ROLE_INFO).map(([key, r]) => ({ key, ...r })), []);
  const colors: Record<string, string> = {
    admin: "from-navy-600 to-navy-800",
    librarian: "from-sky-500 to-blue-700",
    member: "from-emerald-500 to-teal-700",
    cafe_staff: "from-amber-500 to-orange-700",
    cashier: "from-purple-500 to-indigo-700",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl lg:text-5xl font-bold font-['Playfair_Display'] text-navy-900">
          System Actors
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          The Smart Library & Book Café system supports five distinct user roles,
          each with tailored dashboards, permissions, and responsibilities.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {roles.map((r) => {
          const Icon = iconMap[r.icon] || Users;
          return (
            <Card key={r.key} className="overflow-hidden card-hover">
              <div className={`h-2 bg-gradient-to-r ${colors[r.key]}`} />
              <CardBody className="p-7">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors[r.key]} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                    <Icon size={26} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900">{r.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{r.description}</p>
                  </div>
                </div>
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Key Responsibilities</p>
                  <ul className="space-y-2">
                    {r.responsibilities.map((resp, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-navy-600 mt-2 flex-shrink-0" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
