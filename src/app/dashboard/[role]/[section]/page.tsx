"use client";
import { useParams } from "next/navigation";
import {
  BooksManageSection,
  CategoriesSection,
  BorrowingsSection,
  MemberRecordsSection,
  MemberBrowseSection,
  ReservationsSection,
  FinesSection,
  MemberCafeSection,
  CafeInventorySection,
  OrdersManageSection,
  PaymentsManageSection,
  ReportsSection,
  NotificationsSection,
  ProfileSection,
} from "@/components/dashboard/DashboardSections";

export default function RoleSectionPage() {
  const params = useParams();
  const role = params.role as string;
  const section = params.section as string;

  if (section === "profile") return <ProfileSection />;
  if (section === "notifications") return <NotificationsSection />;
  if (section === "reports") return <ReportsSection />;

  if (section === "books") return <BooksManageSection />;
  if (section === "categories") {
    return <CategoriesSection type={role === "cafe-staff" ? "cafe" : "book"} />;
  }

  if (["borrowings", "issue", "returns", "overdue", "borrowed"].includes(section)) {
    return <BorrowingsSection mode={section} role={role} />;
  }

  if (section === "history") {
    if (role === "member") return <BorrowingsSection mode="history" role={role} />;
    if (role === "cafe-staff") return <OrdersManageSection defaultStatus="completed" />;
    if (role === "cashier") return <PaymentsManageSection mode="history" />;
    return <BorrowingsSection mode="history" role={role} />;
  }

  if (section === "members") return <MemberRecordsSection />;
  if (section === "browse") return <MemberBrowseSection />;
  if (section === "reservations") return <ReservationsSection />;
  if (section === "fines") return <FinesSection />;
  if (section === "cafe" && role === "member") return <MemberCafeSection />;

  if (["inventory", "products", "stock"].includes(section)) {
    return <CafeInventorySection mode={section} />;
  }

  if (section === "orders") {
    return <OrdersManageSection defaultStatus={role === "cashier" ? "ready" : ""} />;
  }
  if (section === "prepare") {
    return <OrdersManageSection defaultStatus="preparing" />;
  }

  if (["sales", "payments", "receipts", "daily"].includes(section)) {
    return <PaymentsManageSection mode={section} />;
  }

  return <ProfileSection />;
}
