"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  BookOpen, Coffee, Users, LayoutDashboard, LogOut, Menu, X,
  BookMarked, BookCopy, RotateCcw, Clock, ClipboardList, Package,
  Receipt, BarChart3, Settings, Bell, Search, DollarSign, Tag,
  PlusCircle, ListOrdered, ChefHat, CreditCard, History, FileText,
  UserCog, ChevronRight, Star
} from "lucide-react";
import { useAuth } from "@/components/Providers";
import { cn, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui";
import Image from "next/image";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: number | string;
}

interface DashboardConfig {
  title: string;
  brandColor: string;
  nav: NavItem[];
}

const dashboardConfigs: Record<string, DashboardConfig> = {
  admin: {
    title: "Admin Dashboard",
    brandColor: "from-navy-700 to-navy-900",
    nav: [
      { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/admin/users", label: "User Management", icon: Users },
      { href: "/dashboard/admin/books", label: "Book Management", icon: BookCopy },
      { href: "/dashboard/admin/categories", label: "Book Categories", icon: Tag },
      { href: "/dashboard/admin/borrowings", label: "Borrowings", icon: BookMarked },
      { href: "/dashboard/admin/returns", label: "Returns", icon: RotateCcw },
      { href: "/dashboard/admin/cafe", label: "Café Management", icon: Coffee },
      { href: "/dashboard/admin/inventory", label: "Inventory", icon: Package },
      { href: "/dashboard/admin/sales", label: "Sales", icon: DollarSign },
      { href: "/dashboard/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
      { href: "/dashboard/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/dashboard/admin/profile", label: "Profile Settings", icon: Settings },
    ],
  },
  librarian: {
    title: "Librarian Dashboard",
    brandColor: "from-navy-600 to-navy-800",
    nav: [
      { href: "/dashboard/librarian", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/librarian/books", label: "Manage Books", icon: BookCopy },
      { href: "/dashboard/librarian/books/add", label: "Add New Book", icon: PlusCircle },
      { href: "/dashboard/librarian/categories", label: "Categories", icon: Tag },
      { href: "/dashboard/librarian/borrowings", label: "Borrowing Requests", icon: ClipboardList },
      { href: "/dashboard/librarian/issue", label: "Issue Books", icon: BookMarked },
      { href: "/dashboard/librarian/returns", label: "Return Books", icon: RotateCcw },
      { href: "/dashboard/librarian/overdue", label: "Overdue Books", icon: Clock },
      { href: "/dashboard/librarian/members", label: "Member Records", icon: UserCog },
      { href: "/dashboard/librarian/reports", label: "Reports", icon: FileText },
      { href: "/dashboard/librarian/profile", label: "Profile Settings", icon: Settings },
    ],
  },
  member: {
    title: "Member Portal",
    brandColor: "from-sky-600 to-navy-700",
    nav: [
      { href: "/dashboard/member", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/member/browse", label: "Browse Books", icon: BookOpen },
      { href: "/dashboard/member/borrowed", label: "My Borrowed Books", icon: BookMarked },
      { href: "/dashboard/member/history", label: "Borrowing History", icon: History },
      { href: "/dashboard/member/reservations", label: "My Reservations", icon: Star },
      { href: "/dashboard/member/fines", label: "My Fines", icon: Receipt },
      { href: "/dashboard/member/cafe", label: "Café Services", icon: Coffee },
      { href: "/dashboard/member/notifications", label: "Notifications", icon: Bell },
      { href: "/dashboard/member/profile", label: "Profile Settings", icon: Settings },
    ],
  },
  cafe_staff: {
    title: "Café Dashboard",
    brandColor: "from-amber-600 to-orange-700",
    nav: [
      { href: "/dashboard/cafe-staff", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/cafe-staff/products", label: "Café Products", icon: Coffee },
      { href: "/dashboard/cafe-staff/categories", label: "Product Categories", icon: Tag },
      { href: "/dashboard/cafe-staff/inventory", label: "Inventory", icon: Package },
      { href: "/dashboard/cafe-staff/orders", label: "Orders", icon: ListOrdered },
      { href: "/dashboard/cafe-staff/prepare", label: "Prepare Orders", icon: ChefHat },
      { href: "/dashboard/cafe-staff/history", label: "Order History", icon: History },
      { href: "/dashboard/cafe-staff/stock", label: "Stock Management", icon: ClipboardList },
      { href: "/dashboard/cafe-staff/profile", label: "Profile Settings", icon: Settings },
    ],
  },
  cashier: {
    title: "Cashier POS",
    brandColor: "from-emerald-600 to-teal-700",
    nav: [
      { href: "/dashboard/cashier", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/cashier/pos", label: "Point of Sale", icon: CreditCard },
      { href: "/dashboard/cashier/orders", label: "Café Orders", icon: ListOrdered },
      { href: "/dashboard/cashier/payments", label: "Payments", icon: DollarSign },
      { href: "/dashboard/cashier/history", label: "Sales History", icon: History },
      { href: "/dashboard/cashier/receipts", label: "Receipts", icon: Receipt },
      { href: "/dashboard/cashier/daily", label: "Daily Transactions", icon: ClipboardList },
      { href: "/dashboard/cashier/reports", label: "Financial Reports", icon: BarChart3 },
      { href: "/dashboard/cashier/profile", label: "Profile Settings", icon: Settings },
    ],
  },
};

export default function DashboardLayout({ children, role }: { children: React.ReactNode; role: string }) {
  const config = dashboardConfigs[role];
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (user) {
      fetch("/api/notifications?unread=true&pageSize=5")
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            setNotifications(res.data.items);
            setUnreadCount(res.data.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  if (!config) return <div>Invalid role</div>;

  const markAllRead = async () => {
    await fetch("/api/notifications/all/read", { method: "POST" });
    setUnreadCount(0);
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform lg:translate-x-0 lg:relative",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className={cn("h-16 bg-gradient-to-r flex items-center px-5 gap-2.5", config.brandColor)}>
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">Smart Library</div>
            <div className="text-white/70 text-xs leading-tight">& Café</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {config.nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                  active
                    ? "bg-navy-50 text-navy-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-navy-800"
                )}
              >
                <Icon size={18} className={cn("flex-shrink-0", active ? "text-navy-700" : "text-slate-400 group-hover:text-navy-600")} />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <Badge variant="danger">{item.badge}</Badge>
                ) : active ? <ChevronRight size={14} className="text-navy-600" /> : null}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <h2 className="font-semibold text-slate-900 text-base">{config.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                placeholder="Search..."
                className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-navy-500 focus:outline-none text-sm w-64"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative p-2 rounded-lg hover:bg-slate-100"
              >
                <Bell size={20} className="text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-navy-600 hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-6 text-center text-sm text-slate-500">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={cn("p-3 border-b border-slate-50 hover:bg-slate-50", !n.isRead && "bg-navy-50/50")}>
                          <p className="text-sm font-medium text-slate-900">{n.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{formatDateTime(n.createdAt)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-900 leading-tight">{user?.fullName}</p>
                <p className="text-xs text-slate-500 capitalize leading-tight">{user?.role.replace("_", " ")}</p>
              </div>
              <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-sm", config.brandColor)}>
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
