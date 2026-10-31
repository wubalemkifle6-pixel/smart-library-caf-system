"use client";
import { useState } from "react";
import { DataTable, type ColumnDef } from "@/components/dashboard/DataTable";
import { PageHeader, Button, Modal, Input, Select, showToast, StatusBadge } from "@/components/ui";
import { UserCheck, UserX, Check, X } from "lucide-react";

interface UserRow {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  phone: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    fullName: "", username: "", email: "", password: "", phone: "",
    role: "member", status: "active",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleAction = async (user: UserRow, action: "approve" | "reject" | "activate" | "deactivate") => {
    try {
      const res = await fetch(`/api/users/${user.id}/${action}`, { method: "POST" }).then(r => r.json());
      if (res.success) {
        showToast(res.message || "Action completed", "success");
        setRefreshKey(k => k + 1);
      } else {
        showToast(res.error || "Action failed", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    }
  };

  const handleDeleteUser = async (user: UserRow) => {
    if (!confirm(`Delete user ${user.fullName}? This action is permanent.`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" }).then(r => r.json());
      if (res.success) {
        showToast("User deleted", "success");
        setRefreshKey(k => k + 1);
      } else {
        showToast(res.error, "error");
      }
    } catch {
      showToast("Failed to delete user", "error");
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ fullName: "", username: "", email: "", password: "", phone: "", role: "member", status: "active" });
    setCreateOpen(true);
  };

  const openEdit = (u: UserRow) => {
    setEditId(u.id);
    setForm({
      fullName: u.fullName,
      username: u.username,
      email: u.email,
      password: "",
      phone: u.phone || "",
      role: u.role,
      status: u.status,
    });
    setCreateOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editId ? `/api/users/${editId}` : "/api/users";
      const method = editId ? "PUT" : "POST";
      const payload: Record<string, unknown> = {
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phone: form.phone,
        role: form.role,
        status: form.status,
      };
      if (form.password) payload.password = form.password;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(r => r.json());
      if (res.success) {
        showToast(editId ? "User updated successfully" : "User created successfully", "success");
        setCreateOpen(false);
        setRefreshKey(k => k + 1);
      } else {
        showToast(res.error || "Failed to save user", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<UserRow>[] = [
    { key: "fullName", label: "User", render: (u) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
          {u.fullName?.charAt(0)}
        </div>
        <div>
          <div className="font-medium text-slate-900">{u.fullName}</div>
          <div className="text-xs text-slate-500">@{u.username}</div>
        </div>
      </div>
    )},
    { key: "email", label: "Email", className: "hidden md:table-cell" },
    { key: "role", label: "Role", render: (u) => (
      <span className="capitalize text-xs font-medium">{u.role.replace("_", " ")}</span>
    )},
    { key: "status", label: "Status", render: (u) => <StatusBadge status={u.status} /> },
    { key: "createdAt", label: "Joined", className: "hidden lg:table-cell", render: (u) => new Date(u.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader title="User Management" description="Manage all library users, approve registrations, and assign roles" />
      <DataTable<UserRow>
        title="All Users"
        endpoint="/api/users"
        columns={columns}
        searchPlaceholder="Search by name, username, or email..."
        refreshKey={refreshKey}
        createButtonText="Create User"
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={(u) => u.role !== "admin" ? handleDeleteUser(u) : showToast("Cannot delete admin accounts", "warning")}
        filters={[
          { key: "role", label: "All Roles", options: [
            { value: "admin", label: "Admin" }, { value: "librarian", label: "Librarian" },
            { value: "member", label: "Member" }, { value: "cafe_staff", label: "Café Staff" },
            { value: "cashier", label: "Cashier" },
          ]},
          { key: "status", label: "All Statuses", options: [
            { value: "pending", label: "Pending" }, { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" }, { value: "rejected", label: "Rejected" },
          ]},
        ]}
        actions={(u) => (
          <div className="inline-flex gap-1">
            {u.status === "pending" && (
              <>
                <button onClick={() => handleAction(u, "approve")} className="p-1.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200" title="Approve">
                  <UserCheck size={15} />
                </button>
                <button onClick={() => handleAction(u, "reject")} className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200" title="Reject">
                  <UserX size={15} />
                </button>
              </>
            )}
            {u.status === "active" && u.role !== "admin" && (
              <button onClick={() => handleAction(u, "deactivate")} className="p-1.5 rounded bg-amber-100 text-amber-700 hover:bg-amber-200" title="Deactivate">
                <X size={15} />
              </button>
            )}
            {u.status === "inactive" && (
              <button onClick={() => handleAction(u, "activate")} className="p-1.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200" title="Activate">
                <Check size={15} />
              </button>
            )}
          </div>
        )}
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={editId ? "Edit User" : "Create New User"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Full Name" required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
            <Input label="Username" required value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Email" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <Input label="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <Input
            label={editId ? "New Password (leave blank to keep current)" : "Password"}
            type="password"
            required={!editId}
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Role" value={form.role} onChange={e => setForm({...form, role: e.target.value})}
              options={[
                { value: "admin", label: "Admin" }, { value: "librarian", label: "Librarian" },
                { value: "member", label: "Member" }, { value: "cafe_staff", label: "Café Staff" },
                { value: "cashier", label: "Cashier" },
              ]}
            />
            <Select label="Status" value={form.status} onChange={e => setForm({...form, status: e.target.value})}
              options={[
                { value: "active", label: "Active" }, { value: "pending", label: "Pending" },
                { value: "inactive", label: "Inactive" }, { value: "rejected", label: "Rejected" },
              ]}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editId ? "Save Changes" : "Create User"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
