export type Role = "admin" | "librarian" | "member" | "cafe_staff" | "cashier";

export type UserStatus = "pending" | "active" | "rejected" | "inactive";

export type BorrowingStatus =
  | "pending"
  | "approved"
  | "borrowed"
  | "returned"
  | "overdue"
  | "rejected";

export type ReservationStatus = "active" | "fulfilled" | "cancelled";

export type FineStatus = "pending" | "paid" | "waived";

export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

export type PaymentMethod = "cash" | "card" | "mobile";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
