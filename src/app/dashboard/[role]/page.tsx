"use client";
import { useParams } from "next/navigation";
import {
  LibrarianOverview,
  CafeStaffOverview,
  CashierOverview,
} from "@/components/dashboard/DashboardSections";

export default function RoleOverviewPage() {
  const params = useParams();
  const role = params.role as string;

  if (role === "librarian") return <LibrarianOverview />;
  if (role === "cafe-staff") return <CafeStaffOverview />;
  if (role === "cashier") return <CashierOverview />;

  return <LibrarianOverview />;
}
