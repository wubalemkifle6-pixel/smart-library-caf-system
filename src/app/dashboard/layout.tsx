"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/Providers";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { LoadingSpinner } from "@/components/ui";
import { ToastContainer } from "@/components/ui";

const validRoles = ["admin", "librarian", "member", "cafe-staff", "cashier"];
const roleMap: Record<string, string> = {
  "cafe-staff": "cafe_staff",
};

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  // Extract role from URL
  const segments = pathname.split("/").filter(Boolean);
  const urlRole = segments[1]; // /dashboard/admin/...
  const normalizedRole = roleMap[urlRole] || urlRole;

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (user.status !== "active") {
        router.replace("/login");
      } else {
        // Verify the URL role matches the user's role
        const userRoleUrl = user.role === "cafe_staff" ? "cafe-staff" : user.role;
        if (urlRole && urlRole !== userRoleUrl && validRoles.includes(urlRole)) {
          router.replace(`/dashboard/${userRoleUrl}`);
        }
      }
    }
  }, [user, loading, urlRole, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner label="Loading..." />
      </div>
    );
  }

  if (!user || user.status !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner label="Redirecting..." />
      </div>
    );
  }

  return (
    <>
      <DashboardLayout role={normalizedRole}>{children}</DashboardLayout>
      <ToastContainer />
    </>
  );
}
