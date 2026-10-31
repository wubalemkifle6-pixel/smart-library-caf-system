"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Providers";
import { LoadingSpinner } from "@/components/ui";
import { getDashboardPathByRole } from "@/lib/utils";

export default function DashboardIndex() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && user.status === "active") {
        router.replace(getDashboardPathByRole(user.role));
      } else if (user && user.status === "pending") {
        router.replace("/login?error=pending");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner label="Redirecting..." />
    </div>
  );
}
