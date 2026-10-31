"use client";
import { useState } from "react";
import { DataTable, type ColumnDef } from "@/components/dashboard/DataTable";
import { PageHeader, showToast, StatusBadge, Button } from "@/components/ui";
import { Check, X, RotateCcw, BookMarked } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface BorrowRow {
  id: number;
  bookTitle: string;
  bookCover: string | null;
  userName: string;
  userEmail: string;
  status: string;
  requestDate: string;
  borrowedDate: string | null;
  dueDate: string | null;
  returnedDate: string | null;
}

export default function AdminBorrowingsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAction = async (row: BorrowRow, action: "approve" | "reject" | "issue" | "return" | "cancel") => {
    try {
      const res = await fetch(`/api/borrowings/${row.id}/${action}`, {
        method: "POST",
        headers: action === "reject" ? { "Content-Type": "application/json" } : undefined,
        body: action === "reject" ? JSON.stringify({ reason: "Rejected by administrator" }) : undefined,
      }).then(r => r.json());
      if (res.success) {
        showToast(res.message, "success");
        setRefreshKey(k => k + 1);
      } else {
        showToast(res.error || "Action failed", "error");
      }
    } catch {
      showToast("Action failed", "error");
    }
  };

  const columns: ColumnDef<BorrowRow>[] = [
    { key: "book", label: "Book", render: (b) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-12 rounded bg-navy-100 overflow-hidden flex-shrink-0">
          {b.bookCover && <img src={b.bookCover} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="font-medium text-slate-900 text-sm">{b.bookTitle}</div>
      </div>
    )},
    { key: "userName", label: "Member", render: (b) => (
      <div>
        <div className="text-sm font-medium text-slate-900">{b.userName}</div>
        <div className="text-xs text-slate-500">{b.userEmail}</div>
      </div>
    )},
    { key: "status", label: "Status", render: (b) => <StatusBadge status={b.status} /> },
    { key: "dates", label: "Dates", render: (b) => (
      <div className="text-xs space-y-0.5">
        <div className="text-slate-500">Requested: {formatDate(b.requestDate)}</div>
        {b.dueDate && <div className="text-slate-700">Due: {formatDate(b.dueDate)}</div>}
        {b.returnedDate && <div className="text-emerald-600">Returned: {formatDate(b.returnedDate)}</div>}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Borrowing Management" description="View and manage all book borrowing transactions" />
      <DataTable<BorrowRow>
        title="All Borrowings"
        endpoint="/api/borrowings"
        columns={columns}
        searchPlaceholder="Search by book title or member name..."
        refreshKey={refreshKey}
        filters={[
          { key: "status", label: "All Statuses", options: [
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "borrowed", label: "Borrowed" },
            { value: "returned", label: "Returned" },
            { value: "overdue", label: "Overdue" },
            { value: "rejected", label: "Rejected" },
          ]},
        ]}
        actions={(b) => (
          <div className="inline-flex gap-1">
            {b.status === "pending" && (
              <>
                <button onClick={() => handleAction(b, "approve")} className="p-1.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200" title="Approve">
                  <Check size={14} />
                </button>
                <button onClick={() => handleAction(b, "reject")} className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200" title="Reject">
                  <X size={14} />
                </button>
              </>
            )}
            {(b.status === "approved" || b.status === "pending") && (
              <button onClick={() => handleAction(b, "issue")} className="p-1.5 rounded bg-navy-100 text-navy-700 hover:bg-navy-200" title="Issue Book">
                <BookMarked size={14} />
              </button>
            )}
            {(b.status === "borrowed" || b.status === "overdue") && (
              <button onClick={() => handleAction(b, "return")} className="p-1.5 rounded bg-amber-100 text-amber-700 hover:bg-amber-200" title="Record Return">
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        )}
      />
    </div>
  );
}
