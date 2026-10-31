"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, Coffee, Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "./Providers";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/books", label: "Books" },
  { href: "/cafe", label: "Café" },
  { href: "/actors", label: "Actors" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return null;
    switch (user.role) {
      case "admin":
        return "/dashboard/admin";
      case "librarian":
        return "/dashboard/librarian";
      case "member":
        return "/dashboard/member";
      case "cafe_staff":
        return "/dashboard/cafe-staff";
      case "cashier":
        return "/dashboard/cashier";
      default:
        return null;
    }
  };

  const dashLink = getDashboardLink();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-700 to-navy-500 flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-navy-900 leading-tight text-lg font-['Playfair_Display']">
                Smart Library
              </span>
              <span className="text-xs text-navy-500 leading-tight flex items-center gap-1">
                <Coffee size={10} /> Book Café
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-navy-50 text-navy-800"
                    : "text-slate-600 hover:text-navy-800 hover:bg-slate-100"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                {dashLink && (
                  <Link href={dashLink}>
                    <Button size="sm" variant="primary">
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white text-sm font-medium">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button size="sm" variant="ghost">
                    <User size={16} />
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" variant="primary">
                    Join Now
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm font-medium",
                  pathname === link.href
                    ? "bg-navy-50 text-navy-800"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              {user ? (
                <>
                  {dashLink && (
                    <Link href={dashLink} onClick={() => setMobileOpen(false)}>
                      <Button className="w-full" variant="primary">
                        <LayoutDashboard size={16} /> Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                  >
                    <LogOut size={16} /> Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full" variant="outline">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full" variant="primary">
                      Join Now
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
