import { type ClassValue, clsx } from "clsx";
import { formatDistanceToNow, format } from "date-fns";
import type { Role } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getDashboardPathByRole(role: Role | string): string {
  switch (role) {
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
      return "/";
  }
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount == null) return "$0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM dd, yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM dd, yyyy h:mm a");
}

export function relativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function generateOrderNumber(): string {
  const date = new Date();
  const timestamp = format(date, "yyyyMMddHHmmss");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `ORD-${timestamp}-${random}`;
}

export function calculateFine(dueDate: Date, returnedDate: Date, perDay: number = 0.5): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = returnedDate.getTime() - dueDate.getTime();
  const daysLate = Math.max(0, Math.floor(diff / msPerDay));
  return Math.round(daysLate * perDay * 100) / 100;
}

export const ROLE_INFO: Record<string, { title: string; description: string; icon: string; responsibilities: string[] }> = {
  admin: {
    title: "Administrator",
    description: "Full system access and oversight of all library operations, users, and financials.",
    icon: "Shield",
    responsibilities: [
      "Manage all user accounts and roles",
      "Approve or reject member registrations",
      "Oversee book inventory and categories",
      "Monitor borrowing and returns",
      "Manage café operations and inventory",
      "View financial and operational reports",
      "Configure system-wide settings",
    ],
  },
  librarian: {
    title: "Librarian",
    description: "Manages book inventory, borrowing requests, returns, and member records.",
    icon: "BookOpen",
    responsibilities: [
      "Add, update and catalog books",
      "Process borrowing requests",
      "Issue and receive returned books",
      "Track overdue books and fines",
      "Manage book categories",
      "View member borrowing history",
      "Generate library reports",
    ],
  },
  member: {
    title: "Library Member",
    description: "Registered users who borrow books, reserve titles, and use café services.",
    icon: "Users",
    responsibilities: [
      "Browse and search available books",
      "Submit borrowing requests",
      "Reserve unavailable titles",
      "View current borrowings and due dates",
      "Pay overdue fines",
      "Order from the café",
      "Update personal profile",
    ],
  },
  cafe_staff: {
    title: "Café Staff",
    description: "Prepares orders, manages café inventory, and serves customers.",
    icon: "Coffee",
    responsibilities: [
      "Manage café product inventory",
      "View incoming orders",
      "Prepare and mark orders ready",
      "Track completed orders",
      "Monitor low stock products",
      "Update product availability",
    ],
  },
  cashier: {
    title: "Cashier",
    description: "Handles all point-of-sale payments, receipts, and transaction records.",
    icon: "CreditCard",
    responsibilities: [
      "Process café and fine payments",
      "Manage the point-of-sale interface",
      "Handle cash, card, and mobile payments",
      "Generate customer receipts",
      "Track daily transactions",
      "Generate financial reports",
    ],
  },
};
