"use client";
import { useState, useEffect } from "react";
import { DataTable, type ColumnDef } from "@/components/dashboard/DataTable";
import { PageHeader, Button, Modal, Input, Select, Textarea, showToast, Badge } from "@/components/ui";
import { Coffee } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductRow {
  id: number;
  name: string;
  categoryName: string | null;
  price: string;
  stockQuantity: number;
  isAvailable: boolean;
}

interface Category {
  id: number;
  name: string;
}

const emptyForm = { name: "", categoryId: "", description: "", price: "", stockQuantity: "0" };

export default function AdminCafePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/cafe/categories").then(r => r.json()).then(res => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };

  const openEdit = async (p: ProductRow) => {
    setEditId(p.id);
    const res = await fetch(`/api/cafe/products?pageSize=100`).then(r => r.json());
    if (res.success) {
      const product = res.data.items.find((x: ProductRow) => x.id === p.id);
      if (product) {
        setForm({
          name: product.name, categoryId: String(product.categoryId || ""),
          description: product.description || "", price: product.price,
          stockQuantity: String(product.stockQuantity),
        });
        setModalOpen(true);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        description: form.description,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
      };
      const url = editId ? `/api/cafe/products/${editId}` : "/api/cafe/products";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(r => r.json());
      if (res.success) {
        showToast(editId ? "Product updated" : "Product added", "success");
        setModalOpen(false);
        setRefreshKey(k => k + 1);
      } else {
        showToast(res.error || "Failed", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<ProductRow>[] = [
    { key: "name", label: "Product", render: (p) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
          <Coffee size={18} />
        </div>
        <div className="font-medium text-slate-900">{p.name}</div>
      </div>
    )},
    { key: "categoryName", label: "Category", render: (p) =>
      p.categoryName ? <Badge variant="warning">{p.categoryName}</Badge> : "-"
    },
    { key: "price", label: "Price", render: (p) => <span className="font-semibold text-navy-700">{formatCurrency(p.price)}</span> },
    { key: "stockQuantity", label: "Stock", render: (p) => (
      <span className={p.stockQuantity < 10 ? "text-red-600 font-semibold" : "text-slate-700"}>
        {p.stockQuantity} {p.stockQuantity < 10 && "⚠"}
      </span>
    )},
    { key: "isAvailable", label: "Available", render: (p) =>
      p.isAvailable ? <Badge variant="success">Available</Badge> : <Badge variant="danger">Hidden</Badge>
    },
  ];

  return (
    <div>
      <PageHeader title="Café Products" description="Manage the café menu and inventory" />
      <DataTable<ProductRow>
        title="Menu Items"
        endpoint="/api/cafe/products"
        columns={columns}
        searchPlaceholder="Search products..."
        refreshKey={refreshKey}
        createButtonText="Add Product"
        onCreate={openAdd}
        onEdit={openEdit}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Product" : "Add Product"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Product Name *" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Category" value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
            />
            <Input label="Price (USD) *" type="number" step="0.01" required value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
          </div>
          <Input label="Stock Quantity" type="number" min={0} value={form.stockQuantity} onChange={e => setForm({...form, stockQuantity: e.target.value})} />
          <Textarea label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editId ? "Save" : "Add"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
