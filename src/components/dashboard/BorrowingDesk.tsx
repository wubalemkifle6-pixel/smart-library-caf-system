"use client";
import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList, Check, X, BookMarked, RotateCcw, Clock,
  AlertTriangle, CheckCircle, BookOpen, Info,
} from "lucide-react";
import {
  PageHeader, Button, Badge, StatusBadge, Modal, Textarea, showToast,
} from "@/components/ui";
import { DataTable, type ColumnDef } from "@/components/dashboard/DataTable";
import { formatDate, calculateFine, cn } from "@/lib/utils";

type TabKey = "pending" | "approved" | "borrowed" | "returned";
type ActionKind = "approve" | "reject" | "issue" | "return";

interface BorrowRow {
  id: number;
  bookId: number;
  userId: number;
  status: string;
  requestDate: string;
  approvedDate: string | null;
  borrowedDate: string | null;
  dueDate: string | null;
  returnedDate: string | null;
  notes: string | null;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string | null;
  bookAvailable: number;
  bookTotal: number;
  reservationCount: number;
  fineAmount: string | number | null;
  fineStatus: string | null;
  userName: string;
  userEmail: string;
}

const TABS: Array<{ key: TabKey; label: string; icon: typeof Check; status: string }> = [
  { key: "pending", label: "Pending Requests", icon: ClipboardList, status: "pending" },
  { key: "approved", label: "Approved · Ready to Issue", icon: Check, status: "approved" },
  { key: "borrowed", label: "Currently Borrowed", icon: BookMarked, status: "active" },
  { key: "returned", label: "Returned", icon: RotateCcw, status: "returned" },
];

const daysLate = (due: string | null) =>
  due ? Math.max(0, Math.floor((Date.now() - new Date(due).getTime()) / 86400000)) : 0;

/**
 * Librarian borrowing desk: tabbed approval → issuing → returns workflow.
 * Uses the existing /api/borrowings endpoints unchanged; all rules
 * (14-day loans, $0.50/day fines, stock handling) stay on the server.
 */
export default function BorrowingDesk({
  initialTab = "pending",
  overdueOnly = false,
}: {
  initialTab?: TabKey;
  overdueOnly?: boolean;
}) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [overdueFilter, setOverdueFilter] = useState(overdueOnly);

  // Keep the desk in sync with the route even if React reuses this instance
  // (e.g. sidebar navigation between /issue and /returns).
  useEffect(() => {
    setTab(initialTab);
    setOverdueFilter(overdueOnly);
  }, [initialTab, overdueOnly]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [confirm, setConfirm] = useState<{ row: BorrowRow; action: ActionKind } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const loadCounts = useCallback(() => {
    Promise.all(
      ["pending", "approved", "active", "overdue", "returned"].map((s) =>
        fetch(`/api/borrowings?status=${s}&pageSize=1`)
          .then((r) => r.json())
          .then((res) => [s, res.success ? res.data.total : 0] as const)
          .catch(() => [s, 0] as const)
      )
    ).then((pairs) => setCounts(Object.fromEntries(pairs)));
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts, refreshKey]);

  const openConfirm = (row: BorrowRow, action: ActionKind) => {
    setReason("");
    setConfirm({ row, action });
  };

  const runAction = async () => {
    if (!confirm || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/borrowings/${confirm.row.id}/${confirm.action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: confirm.action === "reject" ? JSON.stringify({ reason: reason.trim() || undefined }) : undefined,
      }).then((r) => r.json());
      if (res.success) {
        showToast(res.message || "Done", "success");
        setConfirm(null);
        setRefreshKey((k) => k + 1); // instant table + counts refresh
      } else {
        showToast(res.error || "Action failed", "error");
      }
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  const columns: ColumnDef<BorrowRow>[] = [
    {
      key: "book", label: "Book", render: (b) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-12 rounded bg-gradient-to-br from-navy-600 to-navy-900 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {b.bookCover ? <img src={b.bookCover} alt="" className="w-full h-full object-cover" /> : <BookOpen size={14} className="text-white/40" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-slate-900 truncate">{b.bookTitle}</p>
            <p className="text-xs text-slate-500 truncate">{b.bookAuthor}</p>
            {Number(b.reservationCount) > 0 && (
              <span className="inline-block mt-1"><Badge variant="info">Reserved ×{b.reservationCount}</Badge></span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "member", label: "Member", render: (b) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{b.userName}</p>
          <p className="text-xs text-slate-500">{b.userEmail}</p>
        </div>
      ),
    },
    { key: "requested", label: "Requested", render: (b) => <span className="text-xs text-slate-600">{formatDate(b.requestDate)}</span> },
    {
      key: "timing", label: tab === "returned" ? "Return Details" : "Loan Dates", render: (b) => (
        <div className="text-xs space-y-0.5">
          {b.approvedDate && !b.borrowedDate && (
            <div className="text-slate-600">Approved: {formatDate(b.approvedDate)}</div>
          )}
          {b.borrowedDate && <div className="text-slate-600">Borrowed: {formatDate(b.borrowedDate)}</div>}
          {b.dueDate && (
            <div className={b.status === "overdue" ? "text-red-600 font-semibold" : "text-slate-700"}>
              Due: {formatDate(b.dueDate)}{b.status === "overdue" ? ` · ${daysLate(b.dueDate)}d late` : ""}
            </div>
          )}
          {b.returnedDate && <div className="text-emerald-600 font-medium">Returned: {formatDate(b.returnedDate)}</div>}
          {!b.borrowedDate && !b.returnedDate && <span className="text-slate-400">Not issued yet</span>}
        </div>
      ),
    },
    ...(tab === "pending" || tab === "approved"
      ? [{
          key: "copies", label: "Copies", render: (b: BorrowRow) => (
            <Badge variant={b.bookAvailable < 1 ? "danger" : b.bookAvailable < 2 ? "warning" : "success"}>
              {b.bookAvailable}/{b.bookTotal} available
            </Badge>
          ),
        }]
      : []),
    ...(tab === "returned"
      ? [{
          key: "fine", label: "Fine", render: (b: BorrowRow) =>
            b.fineAmount && Number(b.fineAmount) > 0 ? (
              <div className="text-xs">
                <span className="font-semibold text-red-600">${Number(b.fineAmount).toFixed(2)}</span>
                {b.fineStatus && <span className="ml-1.5"><StatusBadge status={b.fineStatus} /></span>}
              </div>
            ) : (
              <span className="text-xs text-slate-400">No fine</span>
            ),
        }]
      : []),
    { key: "status", label: "Status", render: (b) => <StatusBadge status={b.status} /> },
  ];

  // Actions are driven by the RECORD's status (not the tab), so a row can
  // never offer an action that its status does not allow.
  const rowActions = (b: BorrowRow) => (
    <div className="inline-flex gap-1.5">
      {b.status === "pending" && (
        <>
          <Button size="sm" variant="success" disabled={busy || b.bookAvailable < 1}
            title={b.bookAvailable < 1 ? "No copies available — cannot approve" : "Approve request"}
            onClick={() => openConfirm(b, "approve")}>
            <Check size={14} /> Approve
          </Button>
          <Button size="sm" variant="danger" disabled={busy} title="Reject request" onClick={() => openConfirm(b, "reject")}>
            <X size={14} /> Reject
          </Button>
        </>
      )}
      {b.status === "approved" && (
        <Button size="sm" disabled={busy || b.bookAvailable < 1}
          title={b.bookAvailable < 1 ? "No copies available" : "Confirm the book was handed to the member"}
          onClick={() => openConfirm(b, "issue")}>
          <BookMarked size={14} /> Issue Book
        </Button>
      )}
      {(b.status === "borrowed" || b.status === "overdue") && (
        <Button size="sm" variant="success" disabled={busy} title="Record return" onClick={() => openConfirm(b, "return")}>
          <RotateCcw size={14} /> Return Book
        </Button>
      )}
    </div>
  );

  const activeTab = TABS.find((t) => t.key === tab)!;
  const confirmRow = confirm?.row;
  const late = confirmRow ? daysLate(confirmRow.dueDate) : 0;
  const finePreview = confirmRow?.dueDate && late > 0 ? calculateFine(new Date(confirmRow.dueDate), new Date(), 0.5) : 0;
  const duePreview = new Date(); duePreview.setDate(duePreview.getDate() + 14);

  const confirmMeta: Record<ActionKind, { title: string; cta: string; variant: "success" | "danger" | "primary" }> = {
    approve: { title: "Approve borrowing request?", cta: "Approve Request", variant: "success" },
    reject: { title: "Reject borrowing request?", cta: "Reject Request", variant: "danger" },
    issue: { title: "Confirm physical issue", cta: "Confirm Issue", variant: "primary" },
    return: { title: "Record book return?", cta: "Confirm Return", variant: "success" },
  };

  return (
    <div>
      <PageHeader
        title="Borrowing Management"
        description="Approve requests, confirm physical issues, and record returns — availability and fines update automatically."
        actions={
          (counts.overdue ?? 0) > 0 ? (
            <Button variant="outline" size="sm" className="text-red-600"
              onClick={() => { setTab("borrowed"); setOverdueFilter(true); }}>
              <AlertTriangle size={15} /> {counts.overdue} overdue
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          const count = counts[t.status] ?? 0;
          return (
            <button key={t.key}
              onClick={() => { setTab(t.key); setOverdueFilter(false); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-[44px]",
                active ? "bg-navy-700 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              )}>
              <Icon size={16} />
              {t.label}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-semibold",
                active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              )}>{count}</span>
            </button>
          );
        })}
      </div>

      <DataTable<BorrowRow>
        key={`${tab}-${overdueFilter}`}
        title={activeTab.label}
        description={
          tab === "pending" ? "Review new requests — approval reserves nothing until the book is issued." :
          tab === "approved" ? "Approved and waiting for physical hand-over to the member." :
          tab === "borrowed" ? "Books currently with members, including overdue loans." :
          "Completed loans with their actual return dates."
        }
        endpoint="/api/borrowings"
        columns={columns}
        refreshKey={refreshKey}
        searchPlaceholder="Search by book title or member name..."
        initialFilters={{ status: tab === "borrowed" && overdueFilter ? "overdue" : activeTab.status }}
        filters={
          tab === "borrowed" ? [{
            key: "status", label: "Borrowed + Overdue", options: [
              { value: "active", label: "Borrowed + Overdue" },
              { value: "borrowed", label: "Borrowed only" },
              { value: "overdue", label: "Overdue only" },
            ],
          }] : tab === "pending" ? [{
            key: "status", label: "Pending requests", options: [
              { value: "pending", label: "Pending" },
              { value: "rejected", label: "Rejected / Cancelled" },
            ],
          }] : undefined
        }
        actions={tab === "returned" ? undefined : rowActions}
      />

      {/* Confirmation dialog */}
      <Modal open={!!confirm} onClose={() => !busy && setConfirm(null)}
        title={confirm ? confirmMeta[confirm.action].title : ""}>
        {confirm && confirmRow && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <div className="w-10 h-14 rounded bg-gradient-to-br from-navy-600 to-navy-900 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {confirmRow.bookCover ? <img src={confirmRow.bookCover} alt="" className="w-full h-full object-cover" /> : <BookOpen size={14} className="text-white/40" />}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm">{confirmRow.bookTitle}</p>
                <p className="text-xs text-slate-500">{confirmRow.bookAuthor}</p>
                <p className="text-xs text-slate-600 mt-1">Member: <span className="font-medium">{confirmRow.userName}</span></p>
              </div>
            </div>

            <div className="text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">Requested</span><span>{formatDate(confirmRow.requestDate)}</span></div>
              {confirm.action === "issue" && (
                <>
                  <div className="flex justify-between"><span className="text-slate-500">Borrow date</span><span className="font-medium">{formatDate(new Date())}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Expected return</span><span className="font-medium">{formatDate(duePreview)}</span></div>
                </>
              )}
              {confirm.action === "return" && (
                <>
                  <div className="flex justify-between"><span className="text-slate-500">Borrowed</span><span>{formatDate(confirmRow.borrowedDate)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Due date</span><span>{formatDate(confirmRow.dueDate)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Return date</span><span className="font-medium">{formatDate(new Date())}</span></div>
                </>
              )}
            </div>

            {confirm.action === "approve" && (
              <div className="flex gap-2 p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs">
                <Info size={15} className="flex-shrink-0 mt-0.5" />
                <span>The member will be notified to collect the book. Availability is only reduced when you confirm the physical issue.</span>
              </div>
            )}
            {confirm.action === "issue" && (
              <div className="flex gap-2 p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs">
                <Info size={15} className="flex-shrink-0 mt-0.5" />
                <span>Confirm only after handing the book to the member. One copy will be deducted from availability ({confirmRow.bookAvailable} available now).</span>
              </div>
            )}
            {confirm.action === "reject" && (
              <Textarea label="Reason (optional, shared with the member)" rows={2}
                value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Membership card expired" />
            )}
            {confirm.action === "return" && (
              <>
                {finePreview > 0 ? (
                  <div className="flex gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                    <span><span className="font-semibold">{late} day{late === 1 ? "" : "s"} overdue.</span> A fine of <span className="font-semibold">${finePreview.toFixed(2)}</span> ($0.50/day) will be issued automatically per library policy.</span>
                  </div>
                ) : (
                  <div className="flex gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />
                    <span>Returned on time — no fine will be issued.</span>
                  </div>
                )}
                <div className="flex gap-2 p-3 rounded-lg bg-slate-50 text-slate-600 text-xs">
                  <Info size={15} className="flex-shrink-0 mt-0.5" />
                  <span>
                    One copy will be added back to availability.
                    {Number(confirmRow.reservationCount) > 0 && ` ${confirmRow.reservationCount} member(s) have this title reserved — the first in the queue will be notified automatically.`}
                  </span>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>Cancel</Button>
              <Button variant={confirmMeta[confirm.action].variant} loading={busy} onClick={runAction}>
                {confirmMeta[confirm.action].cta}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
