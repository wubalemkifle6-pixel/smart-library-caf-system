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
import { AutoReveal, PageTransition } from "@/components/motion/AutoReveal";
import { ThemeToggle } from "@/components/theme/ThemeProvider";

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

  // Close drawer & notification panel whenever the route changes (incl. back button)
  useEffect(() => {
    setSidebarOpen(false);
    setShowNotif(false);
  }, [pathname]);

  // While the mobile drawer is open: lock background scrolling + close on Escape
  useEffect(() => {
    if (!sidebarOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [sidebarOpen]);

  if (!config) return <div>Invalid role</div>;

  const markAllRead = async () => {
    await fetch("/api/notifications/all/read", { method: "POST" });
    setUnreadCount(0);
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  // Shared sidebar content — identical links, icons, and role config
  // for the desktop sidebar and the mobile drawer.
  const renderSidebarInner = (withCloseButton: boolean) => (
    <>
      <div className={cn("h-16 shrink-0 bg-gradient-to-r flex items-center px-5 gap-2.5", config.brandColor)}>
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-white text-sm leading-tight">Smart Library</div>
          <div className="text-white/70 text-xs leading-tight">& Café</div>
        </div>
        {withCloseButton && (
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-white/80 hover:bg-white/10 active:bg-white/20"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-0.5">
        {config.nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 max-sm:py-3 rounded-lg text-sm font-medium transition-colors group",
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
      <div className="p-3 border-t border-slate-200 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => {
            setSidebarOpen(false);
            logout();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 max-sm:py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar — unchanged appearance, in normal flow */}
      <aside className="hidden lg:flex relative w-64 shrink-0 bg-white border-r border-slate-200 flex-col">
        {renderSidebarInner(false)}
      </aside>

      {/* Mobile navigation drawer — mounted only while open, so its final
          position never depends on a transform being applied/composited. */}
      {sidebarOpen && (
        <div className="lg:hidden" role="dialog" aria-modal="true" aria-label="Dashboard navigation">
          <div
            data-testid="drawer-backdrop"
            className="fixed inset-0 z-[60] bg-slate-900/50 animate-fade-in"
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            data-testid="mobile-drawer"
            className="fixed inset-y-0 left-0 z-[70] w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col animate-drawer-in"
          >
            {renderSidebarInner(true)}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              onClick={() => {
                setShowNotif(false);
                setSidebarOpen(true);
              }}
              className="lg:hidden relative z-[45] -ml-1 min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center"
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:block">
              <h2 className="font-semibold text-slate-900 text-base">{config.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle />
            <div className="relative">
              <button
                aria-label="Notifications"
                onClick={() => {
                  setSidebarOpen(false);
                  setShowNotif(!showNotif);
                }}
                className="relative z-[45] p-2 rounded-lg hover:bg-slate-100"
              >
                <Bell size={20} className="text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotif && (
                <div
                  className="fixed inset-0 z-40"
                  aria-hidden="true"
                  onClick={() => setShowNotif(false)}
                />
              )}
              {showNotif && (
                <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-pop">
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-navy-600 hover:underline px-2 py-1.5">
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

        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
          <PageTransition>{children}</PageTransition>
          <AutoReveal />
        </main>
      </div>
    </div>
  );
}
