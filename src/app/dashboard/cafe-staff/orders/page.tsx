"use client";
import { useState, useEffect } from "react";
import { Card, CardBody, PageHeader, Button, Badge, LoadingSpinner, showToast, StatusBadge, EmptyState } from "@/components/ui";
import { Clock, ChefHat, CheckCircle, X } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string | null;
  status: string;
  total: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function CafeOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const load = () => {
    setLoading(true);
    fetch(`/api/cafe/orders?status=${filter}&pageSize=50`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setOrders(res.data.items);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`/api/cafe/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(r => r.json());
      if (res.success) {
        showToast(res.message, "success");
        load();
      } else {
        showToast(res.error || "Update failed", "error");
      }
    } catch {
      showToast("Update failed", "error");
    }
  };

  const getAction = (order: Order) => {
    switch (order.status) {
      case "pending":
        return (
          <Button size="sm" onClick={() => updateStatus(order.id, "preparing")} className="w-full bg-amber-600 hover:bg-amber-700">
            <ChefHat size={14} /> Start Preparing
          </Button>
        );
      case "preparing":
        return (
          <Button size="sm" onClick={() => updateStatus(order.id, "ready")} className="w-full bg-sky-600 hover:bg-sky-700">
            <Clock size={14} /> Mark Ready
          </Button>
        );
      case "ready":
        return (
          <Button size="sm" onClick={() => updateStatus(order.id, "completed")} className="w-full bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle size={14} /> Mark Completed
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <PageHeader title="Café Orders" description="Manage incoming orders and update their status" />

      <div className="flex gap-2 mb-5 overflow-x-auto">
        {["pending", "preparing", "ready", "completed", "cancelled"].map(s => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap ${
              filter === s ? "bg-navy-700 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : orders.length === 0 ? (
        <Card><EmptyState title={`No ${filter} orders`} description={filter === "pending" ? "New orders will appear here" : ""} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => (
            <Card key={order.id} className="card-hover">
              <CardBody className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-500 font-mono">{order.orderNumber}</p>
                    <p className="font-semibold text-slate-900 mt-0.5">{order.customerName}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span><span className="font-semibold text-navy-700">{item.quantity}x</span> {item.productName}</span>
                      <span className="text-slate-500">{formatCurrency(Number(item.unitPrice) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-900">{formatCurrency(order.total)}</span>
                </div>
                {order.notes && (
                  <p className="mt-2 text-xs bg-amber-50 text-amber-800 p-2 rounded border border-amber-100">
                    Note: {order.notes}
                  </p>
                )}
                <div className="mt-3">
                  {getAction(order)}
                  {order.status !== "completed" && order.status !== "cancelled" && (
                    <Button size="sm" variant="outline" className="w-full mt-2 text-red-600 hover:bg-red-50"
                      onClick={() => { if (confirm("Cancel this order?")) updateStatus(order.id, "cancelled"); }}
                    >
                      <X size={14} /> Cancel Order
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
