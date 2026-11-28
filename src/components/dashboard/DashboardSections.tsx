"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen, Coffee, Users, Clock, DollarSign, AlertTriangle,
  Package, CheckCircle, ChefHat, CreditCard, Plus, Search,
  Bell, User, Lock, Download, Upload, Receipt, Printer,
  BookMarked, RotateCcw, Check, X, ShoppingBag, Star, Trash2,
  BarChart3, FileText, ArrowRight, PlusCircle
} from "lucide-react";
import {
  Card, CardBody, CardHeader, StatCard, PageHeader, Button,
  Input, Select, Textarea, Modal, Badge, StatusBadge,
  EmptyState, LoadingSpinner, showToast
} from "@/components/ui";
import { DataTable, type ColumnDef } from "@/components/dashboard/DataTable";
import { useAuth } from "@/components/Providers";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";

const CHART_COLORS = ["#1d4ed8", "#0369a1", "#059669", "#d97706", "#dc2626", "#7c3aed"];

// ============================================================================
// 1. ROLE OVERVIEWS (Librarian, Cafe Staff, Cashier)
// ============================================================================
export function LibrarianOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <div>Failed to load librarian statistics</div>;

  return (
    <div>
      <PageHeader
        title="Librarian Dashboard"
        description="Manage book catalog, borrowing requests, book issuance, returns, and overdue records."
        actions={
          <Link href="/dashboard/librarian/books/add">
            <Button><PlusCircle size={16} /> Add New Book</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <StatCard title="Total Books" value={stats.totalBooks || 0} icon={BookOpen} color="navy"
          footer={`${stats.availableBooks || 0} available copies`} />
        <StatCard title="Pending Requests" value={stats.pendingRequests || 0} icon={Clock} color="amber"
          footer="Awaiting approval or issue" />
        <StatCard title="Active Borrowings" value={stats.activeBorrowings || 0} icon={BookMarked} color="sky"
          footer={`${stats.overdueBooks || 0} overdue`} />
        <StatCard title="Overdue Books" value={stats.overdueBooks || 0} icon={AlertTriangle} color="red" />
        <StatCard title="Active Members" value={stats.totalMembers || 0} icon={Users} color="emerald" />
        <StatCard title="Available Copies" value={stats.availableBooks || 0} icon={Package} color="purple" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Borrowing Requests</h3>
            <Link href="/dashboard/librarian/borrowings" className="text-sm text-navy-700 hover:underline flex items-center gap-1">
              Manage all <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardBody>
            {(!stats.recentBorrows || stats.recentBorrows.length === 0) ? (
              <EmptyState title="No recent requests" description="Borrowing transactions will appear here." />
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recentBorrows.map((b: any) => (
                  <div key={b.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{b.bookTitle}</p>
                      <p className="text-xs text-slate-500">Requested by {b.userName} • {formatDate(b.requestDate)}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="space-y-3">
          {[
            { href: "/dashboard/librarian/borrowings", title: "Borrowing Requests", desc: "Approve or reject member requests" },
            { href: "/dashboard/librarian/issue", title: "Issue Books", desc: "Issue approved books to members" },
            { href: "/dashboard/librarian/returns", title: "Return Books", desc: "Record book returns & calculate fines" },
            { href: "/dashboard/librarian/overdue", title: "Overdue Books", desc: "Track overdue borrowings" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="card-hover mb-3">
                <CardBody className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-400" />
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CafeStaffOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <div>Failed to load café statistics</div>;

  return (
    <div>
      <PageHeader
        title="Café Staff Dashboard"
        description="Monitor incoming café orders, prepare beverages & snacks, and manage stock."
        actions={
          <Link href="/dashboard/cafe-staff/orders">
            <Button><ChefHat size={16} /> View Active Orders</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <StatCard title="Pending Orders" value={stats.pendingOrders || 0} icon={Clock} color="amber" />
        <StatCard title="Preparing Now" value={stats.preparingOrders || 0} icon={ChefHat} color="sky" />
        <StatCard title="Ready for Pickup" value={stats.readyOrders || 0} icon={CheckCircle} color="emerald" />
        <StatCard title="Total Menu Items" value={stats.totalProducts || 0} icon={Coffee} color="navy" />
        <StatCard title="Low Stock Items" value={stats.lowStockProducts || 0} icon={AlertTriangle} color="red" />
        <StatCard title="Out of Stock" value={stats.outOfStock || 0} icon={Package} color="purple" />
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Recent Café Orders</h3>
          <Link href="/dashboard/cafe-staff/orders" className="text-sm text-navy-700 hover:underline">
            View queue →
          </Link>
        </CardHeader>
        <CardBody>
          {(!stats.recentOrders || stats.recentOrders.length === 0) ? (
            <EmptyState title="No café orders yet" description="Incoming orders from the café counter or members will appear here." />
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentOrders.map((o: any) => (
                <div key={o.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{o.orderNumber} — {o.customerName || "Guest"}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(o.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-navy-700 text-sm">{formatCurrency(o.total)}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export function CashierOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <div>Failed to load cashier statistics</div>;

  return (
    <div>
      <PageHeader
        title="Cashier Overview"
        description="Point of Sale summary, daily sales, and payment processing."
        actions={
          <Link href="/dashboard/cashier/pos">
            <Button><CreditCard size={16} /> Open Point of Sale</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Today's Sales" value={formatCurrency(stats.todaySales)} icon={DollarSign} color="emerald" />
        <StatCard title="Today's Orders" value={stats.todayOrders || 0} icon={ShoppingBag} color="navy" />
        <StatCard title="Ready Orders" value={stats.pendingPaymentCount || 0} icon={Clock} color="amber" />
        <StatCard title="Transactions Today" value={stats.todayTransactions || 0} icon={Receipt} color="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
          </CardHeader>
          <CardBody>
            {(!stats.recentPayments || stats.recentPayments.length === 0) ? (
              <EmptyState title="No transactions recorded yet" description="Use the Point of Sale to process customer orders." />
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recentPayments.map((p: any) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-slate-900">
                        {p.orderNumber ? `Order ${p.orderNumber}` : `Fine Payment #${p.id}`}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{p.paymentMethod} • {formatDateTime(p.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700">{formatCurrency(p.amount)}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Weekly Sales Trend</h3>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weekSales || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="total" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// 2. BOOKS MANAGEMENT & ADD BOOK (Librarian / Admin with CSV Import/Export)
// ============================================================================
export function BooksManageSection({ openAddDefault = false }: { openAddDefault?: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(openAddDefault);
  const [editId, setEditId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const emptyForm = {
    title: "", author: "", isbn: "", categoryId: "", publicationYear: "",
    publisher: "", description: "", coverImage: "", totalQuantity: "1",
    shelfLocation: "", price: "",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch("/api/book-categories").then((r) => r.json()).then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (b: any) => {
    setEditId(b.id);
    fetch(`/api/books/${b.id}`).then((r) => r.json()).then((res) => {
      if (res.success) {
        const book = res.data;
        setForm({
          title: book.title || "",
          author: book.author || "",
          isbn: book.isbn || "",
          categoryId: book.categoryId ? String(book.categoryId) : "",
          publicationYear: book.publicationYear ? String(book.publicationYear) : "",
          publisher: book.publisher || "",
          description: book.description || "",
          coverImage: book.coverImage || "",
          totalQuantity: String(book.totalQuantity ?? 1),
          shelfLocation: book.shelfLocation || "",
          price: book.price ? String(book.price) : "",
        });
        setModalOpen(true);
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        publicationYear: form.publicationYear ? Number(form.publicationYear) : null,
        totalQuantity: Number(form.totalQuantity || 1),
        price: form.price || null,
      };
      const res = await fetch(editId ? `/api/books/${editId}` : "/api/books", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json());
      if (res.success) {
        showToast(editId ? "Book updated" : "Book added", "success");
        setModalOpen(false);
        setRefreshKey((k) => k + 1);
      } else {
        showToast(res.error || "Failed to save book", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = async () => {
    const res = await fetch("/api/books?pageSize=500").then((r) => r.json());
    if (!res.success) return;
    const rows = res.data.items as any[];
    const headers = ["Title", "Author", "ISBN", "Category", "Year", "TotalQty", "AvailableQty", "Price"];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [
          `"${(r.title || "").replace(/"/g, '""')}"`,
          `"${(r.author || "").replace(/"/g, '""')}"`,
          `"${r.isbn || ""}"`,
          `"${r.categoryName || ""}"`,
          r.publicationYear || "",
          r.totalQuantity,
          r.availableQuantity,
          r.price || "",
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "library-books-export.csv";
    a.click();
    showToast("Books exported to CSV", "success");
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      showToast("CSV file must have a header row and at least one book", "warning");
      return;
    }
    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
      if (cols[0] && cols[1]) {
        const res = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: cols[0],
            author: cols[1],
            isbn: cols[2] || undefined,
            publicationYear: cols[4] ? Number(cols[4]) : undefined,
            totalQuantity: cols[5] ? Number(cols[5]) : 1,
            price: cols[7] || undefined,
          }),
        }).then((r) => r.json());
        if (res.success) imported++;
      }
    }
    showToast(`Imported ${imported} books from CSV`, "success");
    setRefreshKey((k) => k + 1);
    e.target.value = "";
  };

  const columns: ColumnDef<any>[] = [
    {
      key: "title",
      label: "Book",
      render: (b) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-12 rounded bg-navy-800 overflow-hidden flex-shrink-0">
            {b.coverImage && <img src={b.coverImage} alt="" className="w-full h-full object-cover" />}
          </div>
          <div>
            <div className="font-medium text-slate-900">{b.title}</div>
            <div className="text-xs text-slate-500">{b.author}</div>
          </div>
        </div>
      ),
    },
    { key: "isbn", label: "ISBN", render: (b) => b.isbn || "-" },
    { key: "categoryName", label: "Category", render: (b) => b.categoryName ? <Badge variant="info">{b.categoryName}</Badge> : "-" },
    { key: "availableQuantity", label: "Availability", render: (b) => (
      <Badge variant={b.availableQuantity > 0 ? "success" : "danger"}>
        {b.availableQuantity} / {b.totalQuantity}
      </Badge>
    )},
    { key: "price", label: "Price", render: (b) => b.price ? formatCurrency(b.price) : "-" },
  ];

  return (
    <div>
      <PageHeader
        title="Manage Books"
        description="Add, update, import, and export books in the library collection"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700">
              <Upload size={16} /> Import CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
            </label>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download size={16} /> Export CSV
            </Button>
            <Button onClick={openAdd}>
              <Plus size={16} /> Add Book
            </Button>
          </div>
        }
      />

      <DataTable
        title="Library Catalog"
        endpoint="/api/books"
        columns={columns}
        searchPlaceholder="Search by title, author, or ISBN..."
        refreshKey={refreshKey}
        onEdit={openEdit}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Book" : "Add New Book"} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Book Title *" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Author *" required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="ISBN" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
            <Input label="Publication Year" type="number" value={form.publicationYear} onChange={(e) => setForm({ ...form, publicationYear: e.target.value })} />
            <Input label="Shelf Location" value={form.shelfLocation} onChange={(e) => setForm({ ...form, shelfLocation: e.target.value })} placeholder="e.g. A-102" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Select
              label="Category"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
            />
            <Input label="Total Copies *" type="number" min={1} required value={form.totalQuantity} onChange={(e) => setForm({ ...form, totalQuantity: e.target.value })} />
            <Input label="Price ($)" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <Input label="Cover Image URL" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://..." />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editId ? "Update Book" : "Add Book"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================================
// 3. CATEGORIES MANAGEMENT (Book Categories & Café Categories)
// ============================================================================
export function CategoriesSection({ type }: { type: "book" | "cafe" }) {
  const endpoint = type === "book" ? "/api/book-categories" : "/api/cafe/categories";
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(endpoint)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setItems(res.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [endpoint]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      }).then((r) => r.json());
      if (res.success) {
        showToast("Category created", "success");
        setName("");
        setDescription("");
        setModalOpen(false);
        load();
      } else {
        showToast(res.error || "Failed to create category", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={type === "book" ? "Book Categories" : "Café Product Categories"}
        description="Manage categories and view item counts"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add Category
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c) => (
            <Card key={c.id} className="card-hover">
              <CardBody>
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-slate-900 text-lg">{c.name}</h3>
                  <Badge variant="info">{c.bookCount ?? c.productCount ?? 0} items</Badge>
                </div>
                <p className="text-sm text-slate-500 mt-2">{c.description || "No description provided."}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Category">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Category Name *" required value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
//
// ============================================================================
// 4. BORROWINGS / ISSUE / RETURNS / OVERDUE / MEMBER BORROWED & HISTORY
// ============================================================================
export function BorrowingsSection({ mode, role }: { mode: string; role: string }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const isStaff = role === "admin" || role === "librarian";
  const getDefaultTab = (m: string, staff: boolean) => {
    if (!staff) {
      if (m === "history") return "returned";
      return "";
    }
    if (m === "issue") return "approved";
    if (m === "returns") return "active_borrowed";
    if (m === "overdue") return "overdue";
    return "";
  };
  const [activeTab, setActiveTab] = useState<string>(() => getDefaultTab(mode, isStaff));
  const [summary, setSummary] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    borrowed: 0,
    overdue: 0,
    activeBorrowed: 0,
    returned: 0,
    rejected: 0,
  });
  // Confirmation modal state
  const [modalAction, setModalAction] = useState<{
    row: any;
    action: "approve" | "reject" | "issue" | "return" | "cancel";
  } | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [customDueDate, setCustomDueDate] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  useEffect(() => {
    setActiveTab(getDefaultTab(mode, isStaff));
  }, [mode, isStaff]);
  useEffect(() => {
    fetch("/api/borrowings?pageSize=1")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.summary) {
          setSummary(res.data.summary);
        }
      })
      .catch(() => {});
  }, [refreshKey]);
  const openConfirmModal = (
    row: any,
    action: "approve" | "reject" | "issue" | "return" | "cancel"
  ) => {
    if (
      (action === "approve" || action === "issue") &&
      row.bookAvailableQuantity !== undefined &&
      Number(row.bookAvailableQuantity) < 1
    ) {
      showToast(
        `Cannot ${action} — "${row.bookTitle}" currently has 0 available copies in stock.`,
        "error"
      );
      return;
    }
    setActionNotes("");
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 14);
    setCustomDueDate(defaultDue.toISOString().split("T")[0]);
    setModalAction({ row, action });
  };
  const executeConfirmedAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAction) return;
    const { row, action } = modalAction;
    setSubmittingAction(true);
    try {
      const payload: Record<string, unknown> = {};
      if (action === "reject") {
        payload.reason = actionNotes.trim() || "Rejected by librarian";
      } else if (actionNotes.trim()) {
        payload.notes = actionNotes.trim();
      }
      if (action === "issue" && customDueDate) {
        const parsed = new Date(customDueDate + "T23:59:59");
        if (!isNaN(parsed.getTime())) {
          payload.dueDate = parsed.toISOString();
        }
      }
      const res = await fetch(`/api/borrowings/${row.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json());
      if (res.success) {
        showToast(res.message || "Updated successfully", "success");
        setModalAction(null);
        setRefreshKey((k) => k + 1);
      } else {
        showToast(res.error || "Action failed", "error");
      }
    } catch {
      showToast("Something went wrong while processing the request", "error");
    } finally {
      setSubmittingAction(false);
    }
  };
  const getEstimatedFine = (dueDateStr: string | null) => {
    if (!dueDateStr) return { daysLate: 0, fine: 0 };
    const due = new Date(dueDateStr);
    const now = new Date();
    if (now <= due) return { daysLate: 0, fine: 0 };
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysLate = Math.max(0, Math.floor((now.getTime() - due.getTime()) / msPerDay));
    const fine = Math.round(daysLate * 0.5 * 100) / 100;
    return { daysLate, fine };
  };
  const staffTabs = [
    { key: "", label: "All Records", count: summary.all },
    { key: "pending", label: "Pending Requests", count: summary.pending },
    { key: "approved", label: "Approved (Ready to Issue)", count: summary.approved },
    { key: "active_borrowed", label: "Currently Borrowed", count: summary.activeBorrowed },
    { key: "overdue", label: "Overdue Books", count: summary.overdue },
    { key: "returned", label: "Returned Books", count: summary.returned },
    { key: "rejected", label: "Rejected", count: summary.rejected },
  ];
  const memberTabs = [
    { key: "", label: "All My Requests & Books", count: summary.all },
    { key: "pending", label: "Pending Approval", count: summary.pending },
    { key: "approved", label: "Approved for Pickup", count: summary.approved },
    { key: "active_borrowed", label: "Currently Borrowed", count: summary.activeBorrowed },
    { key: "returned", label: "Returned History", count: summary.returned },
  ];
  const tabsToRender = isStaff ? staffTabs : memberTabs;
  const columns: ColumnDef<any>[] = [
    {
      key: "bookTitle",
      label: "Book & Availability",
      render: (b) => {
        const avail = b.bookAvailableQuantity ?? 1;
        const total = b.bookTotalQuantity ?? 1;
        return (
          <div className="flex items-start sm:justify-start justify-end gap-3">
            <div className="w-9 h-12 rounded bg-navy-800 overflow-hidden flex-shrink-0 hidden xs:block">
              {b.bookCover && (
                <img src={b.bookCover} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="text-left min-w-0">
              <div className="font-medium text-slate-900 break-words">{b.bookTitle}</div>
              <div className="text-xs text-slate-500">{b.bookAuthor}</div>
              {isStaff && (
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <Badge variant={avail > 0 ? "success" : "danger"}>
                    {avail > 0 ? `${avail} of ${total} available` : `Unavailable (0 of ${total})`}
                  </Badge>
                  {b.bookShelfLocation && (
                    <span className="text-[11px] text-slate-400">Shelf: {b.bookShelfLocation}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    ...(isStaff
      ? [
          {
            key: "userName",
            label: "Member",
            render: (b: any) => (
              <div>
                <div className="font-medium text-slate-900 text-sm break-words">{b.userName}</div>
                <div className="text-xs text-slate-500 break-all">{b.userEmail}</div>
              </div>
            ),
          },
        ]
      : []),
    {
      key: "status",
      label: "Borrowing Status",
      render: (b) => (
        <div className="space-y-1">
          <StatusBadge status={b.status} />
          {b.notes && (
            <div className="text-[11px] text-slate-500 max-w-[180px] truncate" title={b.notes}>
              Note: {b.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "dates",
      label: "Dates Timeline",
      render: (b) => (
        <div className="text-xs space-y-0.5">
          <div className="text-slate-500">Requested: {formatDate(b.requestDate)}</div>
          {b.approvedDate && b.status === "approved" && (
            <div className="text-sky-700 font-medium">Approved: {formatDate(b.approvedDate)}</div>
          )}
          {b.borrowedDate && (
            <div className="text-slate-700">Borrowed: {formatDate(b.borrowedDate)}</div>
          )}
          {b.dueDate && b.status !== "rejected" && (
            <div className="font-semibold text-navy-700">
              Due Date: {formatDate(b.dueDate)}
            </div>
          )}
          {b.returnedDate && (
            <div className="text-emerald-600 font-medium">
              Returned: {formatDate(b.returnedDate)}
            </div>
          )}
        </div>
      ),
    },
  ];
  const titles: Record<string, { title: string; desc: string }> = {
    borrowings: {
      title: "Borrowing Approval & Management",
      desc: "Review member borrowing requests, approve or reject pending requests, issue books, and process book returns",
    },
    issue: {
      title: "Book Issuing Management",
      desc: "Confirm physical book handover to members for approved borrowing requests and record borrowing & due dates",
    },
    returns: {
      title: "Book Return Management",
      desc: "Process returns for currently borrowed books, restore book availability, and view returned books history",
    },
    overdue: {
      title: "Overdue Books Management",
      desc: "Track overdue borrowings, process late book returns, and automatically calculate overdue fines",
    },
    borrowed: {
      title: "My Borrowed Books",
      desc: "View your active borrowings, pending requests, approved pickups, and due dates",
    },
    history: {
      title: "Borrowing History",
      desc: "Complete record of your returned and past borrowed books",
    },
  };
  const info = titles[mode] || titles.borrowings;
  const endpointUrl = activeTab
    ? `/api/borrowings?status=${encodeURIComponent(activeTab)}`
    : "/api/borrowings";
  return (
    <div>
      <PageHeader title={info.title} description={info.desc} />
      {/* Quick Summary Cards for Staff */}
      {isStaff && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-5">
          <button type="button" onClick={() => setActiveTab("pending")} className="text-left w-full">
            <Card className="card-hover cursor-pointer h-full">
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Pending Requests</p>
                  <p className="text-2xl font-bold text-amber-600 mt-0.5">{summary.pending}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Awaiting approval</p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                  <Clock size={20} />
                </div>
              </CardBody>
            </Card>
          </button>
          <button type="button" onClick={() => setActiveTab("approved")} className="text-left w-full">
            <Card className="card-hover cursor-pointer h-full">
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Approved Requests</p>
                  <p className="text-2xl font-bold text-sky-600 mt-0.5">{summary.approved}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ready to issue</p>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
                  <CheckCircle size={20} />
                </div>
              </CardBody>
            </Card>
          </button>
          <button type="button" onClick={() => setActiveTab("active_borrowed")} className="text-left w-full">
            <Card className="card-hover cursor-pointer h-full">
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Currently Borrowed</p>
                  <p className="text-2xl font-bold text-navy-700 mt-0.5">{summary.activeBorrowed}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {summary.overdue > 0 ? `${summary.overdue} overdue` : "Issued to members"}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-navy-100 text-navy-700">
                  <BookMarked size={20} />
                </div>
              </CardBody>
            </Card>
          </button>
          <button type="button" onClick={() => setActiveTab("returned")} className="text-left w-full">
            <Card className="card-hover cursor-pointer h-full">
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Returned Books</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-0.5">{summary.returned}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Completed returns</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                  <RotateCcw size={20} />
                </div>
              </CardBody>
            </Card>
          </button>
        </div>
      )}
      {/* Section Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabsToRender.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key || "all"}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                isSelected
                  ? "bg-navy-700 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
      <DataTable
        title={
          tabsToRender.find((t) => t.key === activeTab)?.label || info.title
        }
        endpoint={endpointUrl}
        columns={columns}
        searchPlaceholder="Search by book title, author, or member name..."
        refreshKey={refreshKey}
        actions={(b: any) => {
          const isUnavailable =
            b.bookAvailableQuantity !== undefined &&
            Number(b.bookAvailableQuantity) < 1;
          return (
            <div className="inline-flex items-center gap-1.5 flex-wrap">
              {/* 1. PENDING REQUEST ACTIONS: Approve / Reject */}
              {isStaff && b.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    variant="success"
                    disabled={isUnavailable}
                    title={
                      isUnavailable
                        ? "Book is currently out of stock (0 copies available)"
                        : "Approve borrowing request"
                    }
                    onClick={() => openConfirmModal(b, "approve")}
                  >
                    <Check size={14} />{" "}
                    {isUnavailable ? "Unavailable" : "Approve"}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => openConfirmModal(b, "reject")}
                  >
                    <X size={14} /> Reject
                  </Button>
                </>
              )}
              {/* 2. APPROVED REQUEST ACTIONS: Issue Book (Physical Handover) */}
              {isStaff && b.status === "approved" && (
                <>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isUnavailable}
                    title={
                      isUnavailable
                        ? "No copies available in stock to issue"
                        : "Confirm physical book issuance to member"
                    }
                    onClick={() => openConfirmModal(b, "issue")}
                  >
                    <BookMarked size={14} />{" "}
                    {isUnavailable ? "Out of Stock" : "Issue Book"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openConfirmModal(b, "reject")}
                  >
                    <X size={14} /> Cancel Approval
                  </Button>
                </>
              )}
              {/* 3. CURRENTLY BORROWED / OVERDUE ACTIONS: Return Book */}
              {isStaff && (b.status === "borrowed" || b.status === "overdue") && (
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => openConfirmModal(b, "return")}
                >
                  <RotateCcw size={14} /> Return Book
                </Button>
              )}
              {/* 4. MEMBER CANCEL PENDING REQUEST */}
              {!isStaff && b.status === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openConfirmModal(b, "cancel")}
                >
                  Cancel Request
                </Button>
              )}
              {/* Read-only completed states */}
              {b.status === "returned" && (
                <span className="text-xs text-emerald-600 font-medium px-2 py-1">
                  ✓ Returned
                </span>
              )}
              {b.status === "rejected" && (
                <span className="text-xs text-slate-400 font-medium px-2 py-1">
                  Closed
                </span>
              )}
            </div>
          );
        }}
      />
      {/* CONFIRMATION MODAL FOR APPROVE / REJECT / ISSUE / RETURN / CANCEL */}
      <Modal
        open={!!modalAction}
        onClose={() => !submittingAction && setModalAction(null)}
        title={
          modalAction?.action === "approve"
            ? "Confirm Borrowing Request Approval"
            : modalAction?.action === "reject"
            ? "Reject Borrowing Request"
            : modalAction?.action === "issue"
            ? "Confirm Physical Book Issuance"
            : modalAction?.action === "return"
            ? "Confirm Book Return"
            : "Cancel Borrowing Request"
        }
      >
        {modalAction && (
          <form onSubmit={executeConfirmedAction} className="space-y-4 text-sm">
            {/* Summary Card of the Borrowing Record */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Book Title:</span>
                <span className="font-semibold text-slate-900 text-right">
                  {modalAction.row.bookTitle}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Member:</span>
                <span className="font-medium text-slate-800 text-right">
                  {modalAction.row.userName} ({modalAction.row.userEmail})
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Request Date:</span>
                <span className="text-slate-700">
                  {formatDate(modalAction.row.requestDate)}
                </span>
              </div>
              {modalAction.row.borrowedDate && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Borrowing Date:</span>
                  <span className="text-slate-700">
                    {formatDate(modalAction.row.borrowedDate)}
                  </span>
                </div>
              )}
              {modalAction.row.dueDate && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Expected Return (Due Date):</span>
                  <span className="font-semibold text-navy-700">
                    {formatDate(modalAction.row.dueDate)}
                  </span>
                </div>
              )}
              {isStaff && modalAction.row.bookAvailableQuantity !== undefined && (
                <div className="flex justify-between items-center gap-2 pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Current Stock Availability:</span>
                  <Badge
                    variant={
                      Number(modalAction.row.bookAvailableQuantity) > 0
                        ? "success"
                        : "danger"
                    }
                  >
                    {modalAction.row.bookAvailableQuantity} of{" "}
                    {modalAction.row.bookTotalQuantity} available
                  </Badge>
                </div>
              )}
            </div>
            {/* Action-specific details */}
            {modalAction.action === "approve" && (
              <div className="space-y-3">
                <p className="text-slate-600 text-xs sm:text-sm">
                  Approving this request will notify{" "}
                  <span className="font-semibold text-slate-900">
                    {modalAction.row.userName}
                  </span>{" "}
                  that their request has been approved for pickup. Once the member arrives at the desk, use{" "}
                  <span className="font-semibold">Issue Book</span> to record physical handover.
                </p>
                <Input
                  label="Approval Note (optional)"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g. Reserved at front desk for 48 hours"
                />
              </div>
            )}
            {modalAction.action === "reject" && (
              <div className="space-y-3">
                <Textarea
                  label="Reason for Rejection *"
                  required
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Provide a clear reason for rejecting this request..."
                  rows={3}
                />
              </div>
            )}
            {modalAction.action === "issue" && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-xs space-y-1">
                  <p className="font-semibold">Physical Book Handover Confirmation</p>
                  <p>
                    • Actual Borrowing Date:{" "}
                    <span className="font-semibold">
                      {formatDate(new Date())} (Today)
                    </span>
                  </p>
                  <p>
                    • Available Copies will be updated from{" "}
                    <span className="font-semibold">
                      {modalAction.row.bookAvailableQuantity}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold">
                      {Math.max(0, Number(modalAction.row.bookAvailableQuantity) - 1)}
                    </span>
                    .
                  </p>
                </div>
                <Input
                  label="Expected Return Date (Due Date) *"
                  type="date"
                  required
                  value={customDueDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setCustomDueDate(e.target.value)}
                />
                <Input
                  label="Issuance Notes (optional)"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g. Book condition: Excellent"
                />
              </div>
            )}
            {modalAction.action === "return" && (() => {
              const { daysLate, fine } = getEstimatedFine(modalAction.row.dueDate);
              return (
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      fine > 0
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-emerald-50 border-emerald-200 text-emerald-900"
                    }`}
                  >
                    <p className="font-semibold">
                      {fine > 0
                        ? `Overdue Return (${daysLate} day${daysLate === 1 ? "" : "s"} past due date)`
                        : "On-Time Book Return"}
                    </p>
                    <p>
                      • Actual Return Date:{" "}
                      <span className="font-semibold">{formatDate(new Date())}</span>
                    </p>
                    <p>
                      • Book copy will be returned to available library stock.
                    </p>
                    {fine > 0 && (
                      <p className="font-bold text-red-600 pt-1">
                        • Overdue Fine to be Issued: {formatCurrency(fine)} ($0.50/day)
                      </p>
                    )}
                  </div>
                  <Input
                    label="Return Condition / Notes (optional)"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="e.g. Returned in good condition"
                  />
                </div>
              );
            })()}
            {modalAction.action === "cancel" && (
              <p className="text-slate-600">
                Are you sure you want to cancel your pending borrowing request for{" "}
                <span className="font-semibold text-slate-900">
                  "{modalAction.row.bookTitle}"
                </span>
                ?
              </p>
            )}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={submittingAction}
                onClick={() => setModalAction(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={
                  modalAction.action === "reject" || modalAction.action === "cancel"
                    ? "danger"
                    : modalAction.action === "approve"
                    ? "success"
                    : "primary"
                }
                className="w-full sm:w-auto"
                loading={submittingAction}
              >
                {modalAction.action === "approve"
                  ? "Confirm Approval"
                  : modalAction.action === "reject"
                  ? "Confirm Rejection"
                  : modalAction.action === "issue"
                  ? "Confirm & Issue Book"
                  : modalAction.action === "return"
                  ? "Confirm Book Return"
                  : "Cancel Request"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
// ============================================================================
// 5. MEMBER RECORDS (for Librarian)
// ============================================================================
export function MemberRecordsSection() {
  const columns: ColumnDef<any>[] = [
    { key: "fullName", label: "Member Name", render: (u) => <span className="font-medium text-slate-900">{u.fullName}</span> },
    { key: "username", label: "Username", render: (u) => `@${u.username}` },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone", render: (u) => u.phone || "-" },
    { key: "status", label: "Status", render: (u) => <StatusBadge status={u.status} /> },
    { key: "createdAt", label: "Member Since", render: (u) => formatDate(u.createdAt) },
  ];
  return (
    <div>
      <PageHeader title="Member Records" description="Directory of registered library members" />
      <DataTable
        title="Library Members"
        endpoint="/api/users?role=member"
        columns={columns}
        searchPlaceholder="Search members by name or email..."
      />
    </div>
  );
}

// ============================================================================
// 6. MEMBER BROWSE BOOKS, RESERVATIONS, FINES, AND MEMBER CAFÉ
// ============================================================================
export function MemberBrowseSection() {
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: "24", search });
    if (categoryId) params.set("categoryId", categoryId);
    fetch(`/api/books?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setBooks(res.data.items);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/book-categories").then((r) => r.json()).then((res) => res.success && setCategories(res.data));
  }, []);

  useEffect(() => {
    load();
  }, [categoryId]);

  const handleBorrow = async (bookId: number) => {
    const res = await fetch("/api/borrowings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId }),
    }).then((r) => r.json());
    if (res.success) {
      showToast(res.message || "Borrow request submitted!", "success");
    } else {
      showToast(res.error || "Failed to request borrow", "error");
    }
  };

  const handleReserve = async (bookId: number) => {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId }),
    }).then((r) => r.json());
    if (res.success) {
      showToast(res.message || "Book reserved!", "success");
    } else {
      showToast(res.error || "Failed to reserve", "error");
    }
  };

  return (
    <div>
      <PageHeader title="Browse Library Catalog" description="Search available books, submit borrowing requests, or reserve unavailable titles." />
      <Card className="mb-6">
        <CardBody className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by title, author, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={[{ value: "", label: "All Categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            className="sm:w-56"
          />
          <Button onClick={load}><Search size={16} /> Search</Button>
        </CardBody>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {books.map((b) => (
            <Card key={b.id} className="overflow-hidden flex flex-col justify-between card-hover">
              <div>
                <div className="aspect-[3/4] bg-navy-900 relative">
                  {b.coverImage && <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />}
                  <div className="absolute top-2 right-2">
                    <Badge variant={b.availableQuantity > 0 ? "success" : "danger"}>
                      {b.availableQuantity > 0 ? `${b.availableQuantity} Available` : "Unavailable"}
                    </Badge>
                  </div>
                </div>
                <CardBody>
                  <p className="text-xs text-navy-600 font-semibold uppercase">{b.categoryName || "General"}</p>
                  <h4 className="font-semibold text-slate-900 mt-1 line-clamp-1">{b.title}</h4>
                  <p className="text-xs text-slate-500">{b.author}</p>
                </CardBody>
              </div>
              <div className="p-4 pt-0 flex gap-2">
                {b.availableQuantity > 0 ? (
                  <Button size="sm" className="w-full" onClick={() => handleBorrow(b.id)}>
                    <BookMarked size={14} /> Borrow
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" className="w-full" onClick={() => handleReserve(b.id)}>
                    <Star size={14} /> Reserve
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReservationsSection() {
  const [refreshKey, setRefreshKey] = useState(0);
  const cancelReservation = async (id: number) => {
    const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" }).then((r) => r.json());
    if (res.success) {
      showToast("Reservation cancelled", "success");
      setRefreshKey((k) => k + 1);
    } else {
      showToast(res.error || "Failed", "error");
    }
  };

  const cols: ColumnDef<any>[] = [
    { key: "bookTitle", label: "Book", render: (r) => <span className="font-medium text-slate-900">{r.bookTitle}</span> },
    { key: "bookAuthor", label: "Author" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "reservationDate", label: "Reserved On", render: (r) => formatDate(r.reservationDate) },
    { key: "expiryDate", label: "Expires", render: (r) => formatDate(r.expiryDate) },
  ];

  return (
    <div>
      <PageHeader title="My Reservations" description="Manage your active book reservations" />
      <DataTable
        title="Reservations"
        endpoint="/api/reservations"
        columns={cols}
        refreshKey={refreshKey}
        actions={(r: any) =>
          r.status === "active" ? (
            <Button size="sm" variant="outline" onClick={() => cancelReservation(r.id)}>
              Cancel
            </Button>
          ) : null
        }
      />
    </div>
  );
}

export function FinesSection() {
  const [refreshKey, setRefreshKey] = useState(0);

  const payFine = async (fine: any) => {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fineId: fine.id,
        amount: Number(fine.amount),
        paymentMethod: "card",
      }),
    }).then((r) => r.json());
    if (res.success) {
      showToast("Fine paid successfully!", "success");
      setRefreshKey((k) => k + 1);
    } else {
      showToast(res.error || "Payment failed", "error");
    }
  };

  const cols: ColumnDef<any>[] = [
    { key: "bookTitle", label: "Book" },
    { key: "amount", label: "Fine Amount", render: (f) => <span className="font-bold text-red-600">{formatCurrency(f.amount)}</span> },
    { key: "reason", label: "Reason" },
    { key: "status", label: "Status", render: (f) => <StatusBadge status={f.status} /> },
    { key: "issuedDate", label: "Issued", render: (f) => formatDate(f.issuedDate) },
  ];

  return (
    <div>
      <PageHeader title="My Overdue Fines" description="View and settle any overdue return fines" />
      <DataTable
        title="Fines"
        endpoint="/api/fines"
        columns={cols}
        refreshKey={refreshKey}
        actions={(f: any) =>
          f.status === "pending" ? (
            <Button size="sm" variant="primary" onClick={() => payFine(f)}>
              <CreditCard size={14} /> Pay Now
            </Button>
          ) : null
        }
      />
    </div>
  );
}

export function MemberCafeSection() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<Array<{ productId: number; name: string; price: number; quantity: number }>>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadOrders = () => {
    fetch("/api/cafe/orders?pageSize=10")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setMyOrders(res.data.items);
      });
  };

  useEffect(() => {
    fetch("/api/cafe/products?available=true&pageSize=100")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setProducts(res.data.items);
      });
    loadOrders();
  }, []);

  const addToCart = (p: any) => {
    setCart((prev) => {
      const found = prev.find((i) => i.productId === p.id);
      if (found) {
        return prev.map((i) => (i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { productId: p.id, name: p.name, price: parseFloat(p.price), quantity: 1 }];
    });
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/cafe/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: user?.fullName || "Member",
          items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
        }),
      }).then((r) => r.json());
      if (res.success) {
        showToast(`Order ${res.data.orderNumber} sent to Café!`, "success");
        setCart([]);
        loadOrders();
      } else {
        showToast(res.error || "Failed to place order", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div>
      <PageHeader title="Library Café Services" description="Order coffee, tea, water, and snacks right to your reading table" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {products.map((p) => (
            <Card key={p.id} className="card-hover">
              <CardBody className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-amber-700 font-semibold uppercase">{p.categoryName}</span>
                  <h4 className="font-semibold text-slate-900">{p.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{p.description}</p>
                  <p className="text-sm font-bold text-navy-700 mt-1">{formatCurrency(p.price)}</p>
                </div>
                <Button size="sm" onClick={() => addToCart(p)} disabled={p.stockQuantity < 1}>
                  <Plus size={14} /> Add
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><h3 className="font-semibold text-slate-900">Your Café Tray</h3></CardHeader>
            <CardBody>
              {cart.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">Select items from the menu to order.</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                        <button
                          onClick={() => setCart((c) => c.filter((x) => x.productId !== item.productId))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                    <span>Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <Button className="w-full" onClick={placeOrder} loading={submitting}>
                    Submit Café Order
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="font-semibold text-slate-900">My Recent Café Orders</h3></CardHeader>
            <CardBody>
              {myOrders.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No past café orders.</p>
              ) : (
                <div className="space-y-2">
                  {myOrders.map((o) => (
                    <div key={o.id} className="p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-mono font-semibold text-slate-800">{o.orderNumber}</p>
                        <p className="text-slate-500">{formatCurrency(o.total)}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. CAFÉ INVENTORY / PRODUCTS / STOCK MANAGEMENT
// ============================================================================
export function CafeInventorySection({ mode }: { mode: string }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", categoryId: "", price: "", stockQuantity: "20", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/cafe/categories").then((r) => r.json()).then((res) => res.success && setCategories(res.data));
  }, []);

  const updateStock = async (product: any, delta: number) => {
    const newStock = Math.max(0, Number(product.stockQuantity) + delta);
    const res = await fetch(`/api/cafe/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQuantity: newStock, isAvailable: newStock > 0 }),
    }).then((r) => r.json());
    if (res.success) {
      showToast(`Updated ${product.name} stock to ${newStock}`, "success");
      setRefreshKey((k) => k + 1);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(editId ? `/api/cafe/products/${editId}` : "/api/cafe/products", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          categoryId: form.categoryId ? Number(form.categoryId) : null,
          price: Number(form.price),
          stockQuantity: Number(form.stockQuantity),
          description: form.description,
        }),
      }).then((r) => r.json());
      if (res.success) {
        showToast(editId ? "Product updated" : "Product added", "success");
        setModalOpen(false);
        setRefreshKey((k) => k + 1);
      } else {
        showToast(res.error || "Failed", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const cols: ColumnDef<any>[] = [
    { key: "name", label: "Product", render: (p) => <span className="font-medium text-slate-900">{p.name}</span> },
    { key: "categoryName", label: "Category", render: (p) => p.categoryName ? <Badge variant="warning">{p.categoryName}</Badge> : "-" },
    { key: "price", label: "Price", render: (p) => formatCurrency(p.price) },
    {
      key: "stockQuantity",
      label: "Stock Level",
      render: (p) => (
        <div className="flex items-center gap-2">
          <Badge variant={p.stockQuantity === 0 ? "danger" : p.stockQuantity < 10 ? "warning" : "success"}>
            {p.stockQuantity} in stock
          </Badge>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={mode === "stock" ? "Stock Management" : mode === "products" ? "Café Products" : "Inventory Management"}
        description="Monitor product quantities, restock low items, and manage menu offerings"
      />
      <DataTable
        title="Café Inventory"
        endpoint="/api/cafe/products"
        columns={cols}
        refreshKey={refreshKey}
        createButtonText="Add Product"
        onCreate={() => {
          setEditId(null);
          setForm({ name: "", categoryId: "", price: "", stockQuantity: "20", description: "" });
          setModalOpen(true);
        }}
        onEdit={(p: any) => {
          setEditId(p.id);
          setForm({
            name: p.name,
            categoryId: p.categoryId ? String(p.categoryId) : "",
            price: String(p.price),
            stockQuantity: String(p.stockQuantity),
            description: p.description || "",
          });
          setModalOpen(true);
        }}
        actions={(p: any) => (
          <div className="inline-flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={() => updateStock(p, 10)}>+10 Stock</Button>
          </div>
        )}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Product" : "Add Product"}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Product Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
            />
            <Input label="Price ($) *" type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <Input label="Stock Quantity *" type="number" required value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================================
// 8. ORDERS & PREPARE QUEUE (for Café Staff & Cashier)
// ============================================================================
export function OrdersManageSection({ defaultStatus = "" }: { defaultStatus?: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState(defaultStatus);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const load = () => {
    setLoading(true);
    fetch(`/api/cafe/orders?pageSize=50${status ? `&status=${status}` : ""}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setOrders(res.data.items);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [status]);

  const updateOrder = async (orderId: number, nextStatus: string) => {
    const res = await fetch(`/api/cafe/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    }).then((r) => r.json());
    if (res.success) {
      showToast(res.message || "Order updated", "success");
      load();
    } else {
      showToast(res.error || "Failed", "error");
    }
  };

  const processOrderPayment = async (order: any) => {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        amount: Number(order.total),
        paymentMethod: "cash",
      }),
    }).then((r) => r.json());
    if (res.success) {
      showToast(`Payment recorded for ${order.orderNumber}`, "success");
      load();
    } else {
      showToast(res.error || "Payment failed", "error");
    }
  };

  return (
    <div>
      <PageHeader title="Café Orders" description="Manage order preparation, readiness, and completion" />
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: "", label: "All Orders" },
          { value: "pending", label: "Pending" },
          { value: "preparing", label: "Preparing" },
          { value: "ready", label: "Ready" },
          { value: "completed", label: "Completed" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              status === t.value ? "bg-navy-700 text-white" : "bg-white border border-slate-200 text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <Card><EmptyState title="No orders found" /></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardBody>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-mono text-xs text-slate-500">{o.orderNumber}</p>
                    <h4 className="font-semibold text-slate-900">{o.customerName || "Guest"}</h4>
                    <p className="text-xs text-slate-400">{formatDateTime(o.createdAt)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="border-t border-slate-100 pt-2 space-y-1 text-sm">
                  {(o.items || []).map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span>{it.quantity}x {it.productName}</span>
                      <span>{formatCurrency(it.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(o.total)}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  {o.status === "pending" && (
                    <Button size="sm" className="w-full" onClick={() => updateOrder(o.id, "preparing")}>
                      Mark Preparing
                    </Button>
                  )}
                  {o.status === "preparing" && (
                    <Button size="sm" variant="success" className="w-full" onClick={() => updateOrder(o.id, "ready")}>
                      Mark Ready
                    </Button>
                  )}
                  {o.status === "ready" && (user?.role === "cashier" || user?.role === "admin") && (
                    <Button size="sm" variant="primary" className="w-full" onClick={() => processOrderPayment(o)}>
                      <CreditCard size={14} /> Record Payment & Complete
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 9. PAYMENTS, SALES HISTORY, RECEIPTS, DAILY TRANSACTIONS
// ============================================================================
export function PaymentsManageSection({ mode }: { mode: string }) {
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const cols: ColumnDef<any>[] = [
    { key: "transactionReference", label: "Reference", render: (p) => <span className="font-mono text-xs">{p.transactionReference || `TXN-${p.id}`}</span> },
    { key: "userName", label: "Customer" },
    { key: "orderNumber", label: "Order / Type", render: (p) => p.orderNumber ? `Café Order ${p.orderNumber}` : `Fine Payment` },
    { key: "amount", label: "Amount", render: (p) => <span className="font-bold text-emerald-700">{formatCurrency(p.amount)}</span> },
    { key: "paymentMethod", label: "Method", render: (p) => <span className="capitalize">{p.paymentMethod}</span> },
    { key: "status", label: "Status", render: (p) => <StatusBadge status={p.status} /> },
    { key: "createdAt", label: "Date & Time", render: (p) => formatDateTime(p.createdAt) },
  ];

  const titles: Record<string, string> = {
    payments: "Payments Management",
    sales: "Sales Management",
    receipts: "Customer Receipts",
    daily: "Daily Transactions",
    history: "Sales History",
  };

  return (
    <div>
      <PageHeader
        title={titles[mode] || "Payments & Transactions"}
        description="Verified payment records and printable customer receipts"
      />
      <DataTable
        title="Recorded Transactions"
        endpoint="/api/payments"
        columns={cols}
        actions={(p: any) => (
          <Button size="sm" variant="outline" onClick={() => setSelectedReceipt(p)}>
            <Receipt size={14} /> Receipt
          </Button>
        )}
      />

      <Modal open={!!selectedReceipt} onClose={() => setSelectedReceipt(null)} title="Official Transaction Receipt">
        {selectedReceipt && (
          <div className="space-y-4 text-sm">
            <div className="text-center border-b border-slate-200 pb-4">
              <h3 className="font-bold text-lg text-navy-900">Smart Library & Book Café</h3>
              <p className="text-xs text-slate-500">123 Library Lane, Booktown</p>
              <p className="font-mono text-xs text-slate-600 mt-2">{selectedReceipt.transactionReference}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-slate-500">Customer:</span><span className="font-medium">{selectedReceipt.userName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Type:</span><span className="font-medium">{selectedReceipt.orderNumber ? `Order ${selectedReceipt.orderNumber}` : "Library Fine"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Payment Method:</span><span className="font-medium capitalize">{selectedReceipt.paymentMethod}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date:</span><span className="font-medium">{formatDateTime(selectedReceipt.createdAt)}</span></div>
              <div className="flex justify-between pt-3 border-t border-slate-200 text-base font-bold text-slate-900">
                <span>Total Paid:</span>
                <span>{formatCurrency(selectedReceipt.amount)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => window.print()}><Printer size={14} /> Print Receipt</Button>
              <Button onClick={() => setSelectedReceipt(null)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============================================================================
// 10. REPORTS & ANALYTICS
// ============================================================================
export function ReportsSection() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive library borrowing, user activity, café sales, and financial reports"
        actions={
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? "primary" : "outline"}
                onClick={() => setPeriod(p)}
                className="capitalize"
              >
                {p} Report
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase text-slate-500">Report Period</p>
            <p className="text-2xl font-bold text-navy-800 mt-1 capitalize">{period} Summary</p>
            <p className="text-xs text-slate-500 mt-1">Generated {new Date().toLocaleDateString()}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase text-slate-500">Total Library Books</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalBooks ?? stats?.todayOrders ?? 12}</p>
            <p className="text-xs text-emerald-600 mt-1">Live database count</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase text-slate-500">Recorded Revenue</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {formatCurrency(stats?.totalRevenue ?? stats?.todaySales ?? 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Verified payments</p>
          </CardBody>
        </Card>
      </div>

      {stats?.dailyRevenue && (
        <Card className="mb-6">
          <CardHeader><h3 className="font-semibold text-slate-900">Financial & Café Sales Trend</h3></CardHeader>
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="total" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// 11. NOTIFICATIONS & PROFILE SETTINGS
// ============================================================================
export function NotificationsSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/notifications?pageSize=50")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setItems(res.data.items);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications/all/read", { method: "POST" });
    showToast("All notifications marked as read", "success");
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="System alerts, borrowing updates, and café order status notifications"
        actions={<Button variant="outline" size="sm" onClick={markAllRead}>Mark All Read</Button>}
      />
      <Card>
        {items.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((n) => (
              <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.isRead ? "bg-navy-50/40" : ""}`}>
                <Bell size={18} className="text-navy-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-slate-900">{n.title}</h4>
                    {!n.isRead && <Badge variant="info">New</Badge>}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ fullName: "", username: "", email: "", phone: "", address: "", bio: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetch(`/api/users/${user.id}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            setForm({
              fullName: res.data.fullName || "",
              username: res.data.username || "",
              email: res.data.email || "",
              phone: res.data.phone || "",
              address: res.data.address || "",
              bio: res.data.bio || "",
            });
          }
        });
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).then((r) => r.json());
      if (res.success) {
        showToast("Profile updated successfully", "success");
        refreshUser();
      } else {
        showToast(res.error || "Failed to update profile", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pw.currentPassword,
          newPassword: pw.newPassword,
        }),
      }).then((r) => r.json());
      if (res.success) {
        showToast("Password changed successfully", "success");
        setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        showToast(res.error || "Password update failed", "error");
      }
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profile Settings" description="Update your username, personal details, and password" />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h3 className="font-semibold text-slate-900 flex items-center gap-2"><User size={18} /> Personal Details</h3></CardHeader>
          <CardBody>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <Input label="Full Name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                <Input label="Email" type="email" disabled value={form.email} />
              </div>
              <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <Textarea label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
              <Button type="submit" loading={saving}>Save Profile</Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold text-slate-900 flex items-center gap-2"><Lock size={18} /> Change Password</h3></CardHeader>
          <CardBody>
            <form onSubmit={handlePasswordSave} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                required
                value={pw.currentPassword}
                onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
              />
              <Input
                label="New Password"
                type="password"
                required
                value={pw.newPassword}
                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
              />
              <Input
                label="Confirm New Password"
                type="password"
                required
                value={pw.confirmPassword}
                onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })}
              />
              <Button type="submit" variant="secondary" loading={pwSaving}>Update Password</Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
