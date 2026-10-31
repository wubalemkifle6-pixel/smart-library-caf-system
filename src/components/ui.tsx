"use client";
import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

// ============ Button ============
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-navy-700 hover:bg-navy-800 text-white shadow-sm",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-800",
    outline: "border border-slate-300 hover:bg-slate-50 text-slate-700 bg-white",
    ghost: "hover:bg-slate-100 text-slate-700",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-6 py-3 text-base rounded-lg",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="spinner" />}
      {children}
    </button>
  );
}

// ============ Card ============
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5 border-b border-slate-100", className)}>{children}</div>;
}
export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5 border-t border-slate-100", className)}>{children}</div>;
}

// ============ Inputs ============
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}
export function Input({ className, label, error, icon, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-100",
            icon && "pl-10",
            error && "border-red-400 focus:border-red-500 focus:ring-red-100",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}
export function Select({ label, error, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-100",
          error && "border-red-400",
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-100 resize-none",
          error && "border-red-400",
          className
        )}
        rows={4}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ============ Badge ============
export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const variants = {
    default: "bg-navy-100 text-navy-800",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-sky-100 text-sky-800",
    neutral: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant]
      )}
    >
      {children}
    </span>
  );
}

// ============ Modal ============
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className={cn("w-full bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto", sizes[size])}>
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ============ Toast / Notifications ============
type ToastType = "success" | "error" | "warning" | "info";
export function showToast(message: string, type: ToastType = "info") {
  const event = new CustomEvent("show-toast", { detail: { message, type } });
  window.dispatchEvent(event);
}
export function ToastContainer() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([]);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message: string; type: ToastType };
      const id = Date.now();
      setToasts((prev) => [...prev, { id, ...detail }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    window.addEventListener("show-toast", handler);
    return () => window.removeEventListener("show-toast", handler);
  }, []);
  const icons = { success: CheckCircle, error: AlertCircle, warning: AlertTriangle, info: Info };
  const colors = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-sky-50 border-sky-200 text-sky-800",
  };
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-in",
              colors[t.type]
            )}
          >
            <Icon size={20} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="opacity-60 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ============ Stat Card ============
export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "navy",
  footer,
}: {
  title: string;
  value: string | number;
  icon?: any;
  trend?: { value: string; positive?: boolean };
  color?: "navy" | "emerald" | "amber" | "red" | "sky" | "purple";
  footer?: ReactNode;
}) {
  const colorMap = {
    navy: "bg-navy-100 text-navy-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    sky: "bg-sky-100 text-sky-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <Card className="card-hover">
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
            {trend && (
              <p className={cn(
                "mt-1 text-xs font-medium",
                trend.positive ? "text-emerald-600" : "text-red-600"
              )}>
                {trend.value}
              </p>
            )}
          </div>
          {Icon && (
            <div className={cn("p-3 rounded-xl", colorMap[color])}>
              <Icon size={24} />
            </div>
          )}
        </div>
        {footer && <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">{footer}</div>}
      </CardBody>
    </Card>
  );
}

// ============ Page Header ============
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ============ Empty State ============
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: any;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
          <Icon size={32} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============ Loading Spinner (full page) ============
export function LoadingSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
      <p className="mt-4 text-sm text-slate-500">{label}</p>
    </div>
  );
}

// ============ Status Badge ============
export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> = {
    active: { label: "Active", variant: "success" },
    inactive: { label: "Inactive", variant: "neutral" },
    pending: { label: "Pending", variant: "warning" },
    rejected: { label: "Rejected", variant: "danger" },
    approved: { label: "Approved", variant: "success" },
    borrowed: { label: "Borrowed", variant: "info" },
    returned: { label: "Returned", variant: "success" },
    overdue: { label: "Overdue", variant: "danger" },
    paid: { label: "Paid", variant: "success" },
    completed: { label: "Completed", variant: "success" },
    preparing: { label: "Preparing", variant: "warning" },
    ready: { label: "Ready", variant: "info" },
    cancelled: { label: "Cancelled", variant: "danger" },
    fulfilled: { label: "Fulfilled", variant: "success" },
    waived: { label: "Waived", variant: "neutral" },
    failed: { label: "Failed", variant: "danger" },
    refunded: { label: "Refunded", variant: "warning" },
  };
  const s = statusMap[status] || { label: status, variant: "neutral" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
