"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, BookOpen, BookMarked, Clock, DollarSign, AlertTriangle,
  ShoppingBag, Package, TrendingUp, ChevronRight,
} from "lucide-react";
import { Card, CardBody, CardHeader, StatCard, PageHeader, LoadingSpinner, Badge } from "@/components/ui";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  totalBooks: number;
  totalBookCopies: number;
  availableBooks: number;
  borrowedBooks: number;
  overdueBooks: number;
  totalRevenue: string;
  cafeRevenue: string;
  totalOrders: number;
  lowStockProducts: number;
  dailyRevenue: Array<{ date: string; total: number }>;
  borrowsByCategory: Array<{ categoryname: string; count: number }>;
}

const COLORS = ["#1d4ed8", "#0369a1", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(r => r.json())
      .then(res => {
        if (res.success) setStats(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <div>Failed to load stats</div>;

  return (
    <div>
      <PageHeader
        title="Admin Overview"
        description="Welcome back! Here's what's happening across your library today."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="navy"
          footer={`${stats.activeUsers} active`} />
        <StatCard title="Total Books" value={stats.totalBooks} icon={BookOpen} color="sky"
          footer={`${stats.availableBooks} copies available of ${stats.totalBookCopies}`} />
        <StatCard title="Borrowed Books" value={stats.borrowedBooks} icon={BookMarked} color="emerald"
          footer={`${stats.overdueBooks} overdue`} />
        <StatCard title="Pending Approvals" value={stats.pendingApprovals} icon={AlertTriangle} color="amber"
          footer="Awaiting review" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="emerald" />
        <StatCard title="Café Sales" value={formatCurrency(stats.cafeRevenue)} icon={ShoppingBag} color="amber" />
        <StatCard title="Café Orders" value={stats.totalOrders} icon={Package} color="purple" />
        <StatCard title="Low Stock Items" value={stats.lowStockProducts} icon={AlertTriangle} color="red"
          footer="Need restocking" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-5 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-navy-600" />
              Revenue (Last 14 Days)
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(v) => formatCurrency(Number(v))}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="total" fill="#1d4ed8" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Borrowings by Category</h3>
          </CardHeader>
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.borrowsByCategory as any[]}
                    dataKey="count"
                    nameKey="categoryname"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry: any) => (entry.categoryname || "").substring(0, 8)}
                    labelLine={false}
                  >
                    {stats.borrowsByCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: "/dashboard/admin/users", title: "Manage Users", desc: "Approve new members, manage roles" },
          { href: "/dashboard/admin/books", title: "Manage Books", desc: "Add, edit, or remove titles" },
          { href: "/dashboard/admin/borrowings", title: "Borrowings", desc: "View all borrowing activity" },
          { href: "/dashboard/admin/cafe", title: "Café Management", desc: "Products, orders, inventory" },
          { href: "/dashboard/admin/sales", title: "Sales & Payments", desc: "Track all transactions" },
          { href: "/dashboard/admin/reports", title: "Reports", desc: "Detailed analytics and reports" },
        ].map(l => (
          <Link key={l.href} href={l.href}>
            <Card className="card-hover cursor-pointer">
              <CardBody className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">{l.title}</h4>
                  <p className="text-sm text-slate-500 mt-0.5">{l.desc}</p>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
