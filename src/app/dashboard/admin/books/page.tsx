"use client";
import { useState, useEffect } from "react";
import { DataTable, type ColumnDef } from "@/components/dashboard/DataTable";
import { PageHeader, Button, Modal, Input, Select, Textarea, showToast, StatusBadge, Badge } from "@/components/ui";
import { BookOpen } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BookRow {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  categoryName: string | null;
  availableQuantity: number;
  totalQuantity: number;
  price: string | null;
  coverImage: string | null;
}

interface Category {
  id: number;
  name: string;
}

const emptyForm = {
  title: "", author: "", isbn: "", categoryId: "", publicationYear: "", publisher: "",
  description: "", coverImage: "", totalQuantity: "1", price: "",
};

export default function AdminBooksPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/book-categories").then(r => r.json()).then(res => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (b: BookRow) => {
    setEditId(b.id);
    fetch(`/api/books/${b.id}`).then(r => r.json()).then(res => {
      if (res.success) {
        const book = res.data;
        setForm({
          title: book.title, author: book.author, isbn: book.isbn || "",
          categoryId: book.categoryId || "", publicationYear: book.publicationYear || "",
          publisher: book.publisher || "", description: book.description || "",
          coverImage: book.coverImage || "", totalQuantity: String(book.totalQuantity || 1),
          price: book.price || "",
        });
        setModalOpen(true);
      }
    });
  };

  const handleDelete = async (b: BookRow) => {
    if (!confirm(`Delete book "${b.title}"?`)) return;
    try {
      const res = await fetch(`/api/books/${b.id}`, { method: "DELETE" }).then(r => r.json());
      if (res.success) {
        showToast("Book deleted", "success");
        setRefreshKey(k => k + 1);
      } else {
        showToast(res.error || "Delete failed", "error");
      }
    } catch {
      showToast("Delete failed", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        publicationYear: form.publicationYear ? Number(form.publicationYear) : null,
        totalQuantity: Number(form.totalQuantity),
        price: form.price || null,
      };
      const url = editId ? `/api/books/${editId}` : "/api/books";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(r => r.json());
      if (res.success) {
        showToast(editId ? "Book updated" : "Book added", "success");
        setModalOpen(false);
        setRefreshKey(k => k + 1);
      } else {
        showToast(res.error || "Failed to save", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<BookRow>[] = [
    { key: "title", label: "Book", render: (b) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-14 rounded bg-gradient-to-br from-navy-600 to-navy-900 overflow-hidden flex-shrink-0">
          {b.coverImage ? <img src={b.coverImage} alt="" className="w-full h-full object-cover" /> : <BookOpen size={14} className="text-white/40 m-auto mt-3" />}
        </div>
        <div>
          <div className="font-medium text-slate-900 line-clamp-1">{b.title}</div>
          <div className="text-xs text-slate-500">{b.author}</div>
        </div>
      </div>
    )},
    { key: "isbn", label: "ISBN", className: "hidden md:table-cell", render: (b) => b.isbn || "-" },
    { key: "categoryName", label: "Category", className: "hidden lg:table-cell", render: (b) =>
      b.categoryName ? <Badge variant="info">{b.categoryName}</Badge> : "-"
    },
    { key: "stock", label: "Stock", render: (b) => (
      <span className="text-sm">
        <span className="font-semibold text-navy-700">{b.availableQuantity}</span>
        <span className="text-slate-400"> / {b.totalQuantity}</span>
      </span>
    )},
    { key: "price", label: "Price", className: "hidden sm:table-cell", render: (b) =>
      b.price ? formatCurrency(b.price) : "-"
    },
  ];

  const handleExportCSV = async () => {
    const res = await fetch("/api/books?pageSize=500").then(r => r.json());
    if (!res.success) return;
    const rows = res.data.items as BookRow[];
    const headers = ["Title", "Author", "ISBN", "Category", "TotalQuantity", "AvailableQuantity", "Price"];
    const csv = [
      headers.join(","),
      ...rows.map(r => [
        `"${(r.title || "").replace(/"/g, '""')}"`,
        `"${(r.author || "").replace(/"/g, '""')}"`,
        `"${r.isbn || ""}"`,
        `"${r.categoryName || ""}"`,
        r.totalQuantity,
        r.availableQuantity,
        r.price || ""
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "books-export.csv";
    a.click();
    showToast("Books exported to CSV", "success");
  };

  return (
    <div>
      <PageHeader
        title="Book Management"
        description="Add, edit, import/export, and remove books from the library catalog"
        actions={
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            Export CSV
          </Button>
        }
      />
      <DataTable<BookRow>
        title="Books Catalog"
        endpoint="/api/books"
        columns={columns}
        searchPlaceholder="Search by title, author, or ISBN..."
        refreshKey={refreshKey}
        createButtonText="Add Book"
        onCreate={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Edit Book" : "Add New Book"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Title *" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            <Input label="Author *" required value={form.author} onChange={e => setForm({...form, author: e.target.value})} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="ISBN" value={form.isbn} onChange={e => setForm({...form, isbn: e.target.value})} />
            <Input label="Publication Year" type="number" value={form.publicationYear} onChange={e => setForm({...form, publicationYear: e.target.value})} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Category" value={String(form.categoryId)} onChange={e => setForm({...form, categoryId: e.target.value})}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
            />
            <Input label="Publisher" value={form.publisher} onChange={e => setForm({...form, publisher: e.target.value})} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Total Quantity" type="number" min={0} value={form.totalQuantity} onChange={e => setForm({...form, totalQuantity: e.target.value})} />
            <Input label="Price (USD)" type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
          </div>
          <Input label="Cover Image URL" value={form.coverImage} onChange={e => setForm({...form, coverImage: e.target.value})} placeholder="https://..." />
          <Textarea label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editId ? "Save Changes" : "Add Book"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
