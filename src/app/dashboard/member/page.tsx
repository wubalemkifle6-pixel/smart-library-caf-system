"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, BookMarked, Clock, DollarSign, Star, Library, Bell, History, Coffee, ChevronRight } from "lucide-react";
import { Card, CardBody, PageHeader, StatCard, LoadingSpinner, Badge } from "@/components/ui";
import { useAuth } from "@/components/Providers";
import { formatCurrency, formatDate } from "@/lib/utils";

interface MemberStats {
  currentlyBorrowed: number;
  pendingRequests: number;
  activeReservations: number;
  unpaidFines: string;
  recentBorrows: Array<{
    id: number;
    status: string;
    borrowedDate: string | null;
    dueDate: string | null;
    bookTitle: string;
    bookCover: string | null;
  }>;
}

export default function MemberDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats").then(r => r.json()).then(res => {
      if (res.success) setStats(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <div>Failed to load</div>;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.fullName?.split(" ")[0] || "Reader"}!`}
        description="Your reading journey at a glance."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Currently Borrowed" value={stats.currentlyBorrowed} icon={BookMarked} color="navy" />
        <StatCard title="Pending Requests" value={stats.pendingRequests} icon={Clock} color="amber" />
        <StatCard title="Active Reservations" value={stats.activeReservations} icon={Star} color="purple" />
        <StatCard title="Unpaid Fines" value={formatCurrency(Number(stats.unpaidFines))} icon={DollarSign} color={Number(stats.unpaidFines) > 0 ? "red" : "emerald"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Borrowing Activity</h3>
            <Link href="/dashboard/member/history" className="text-sm text-navy-700 font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <CardBody>
            {stats.recentBorrows.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                You haven't borrowed any books yet. <Link href="/dashboard/member/browse" className="text-navy-700 font-medium hover:underline">Browse the catalog</Link> to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentBorrows.map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
                    <div className="w-10 h-14 rounded bg-gradient-to-br from-navy-600 to-navy-900 overflow-hidden flex-shrink-0">
                      {b.bookCover && <img src={b.bookCover} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm truncate">{b.bookTitle}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {b.status === "borrowed" && <>Due: {formatDate(b.dueDate)}</>}
                        {b.status === "pending" && "Awaiting approval"}
                        {b.status === "returned" && `Returned ${formatDate(b.dueDate)}`}
                        {b.status === "approved" && "Ready for pickup"}
                      </div>
                    </div>
                    <Badge variant={
                      b.status === "borrowed" ? "info" :
                      b.status === "returned" ? "success" :
                      b.status === "pending" ? "warning" :
                      b.status === "overdue" ? "danger" : "success"
                    }>{b.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Link href="/dashboard/member/browse">
            <Card className="card-hover cursor-pointer">
              <CardBody className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-navy-100 text-navy-700 flex items-center justify-center">
                  <Library size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Browse Books</h4>
                  <p className="text-xs text-slate-500">Search the catalog</p>
                </div>
              </CardBody>
            </Card>
          </Link>
          <Link href="/dashboard/member/borrowed">
            <Card className="card-hover cursor-pointer">
              <CardBody className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <BookMarked size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">My Books</h4>
                  <p className="text-xs text-slate-500">View current borrows</p>
                </div>
              </CardBody>
            </Card>
          </Link>
          <Link href="/dashboard/member/cafe">
            <Card className="card-hover cursor-pointer">
              <CardBody className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Coffee size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Order from Café</h4>
                  <p className="text-xs text-slate-500">Browse menu & order</p>
                </div>
              </CardBody>
            </Card>
          </Link>
          <Link href="/dashboard/member/profile">
            <Card className="card-hover cursor-pointer">
              <CardBody className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">My Account</h4>
                  <p className="text-xs text-slate-500">Profile & settings</p>
                </div>
              </CardBody>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
